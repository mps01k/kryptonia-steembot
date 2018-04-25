var mysql = require('mysql');
var moment = require('moment');

var config = require('./../../config.json');

var db_con = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
});

module.exports = {
    save_to_db: (item) => {
        var values = [
            [item.task_id, item.author, item.link, item.by_bot, item.status, item.created_at, item.updated_at],
        ];
        var sql = `INSERT INTO steem_vote_lists (task_id, author, link, by_bot, status, created_at, updated_at) VALUES ?`;
        db_con.query(sql, [values], function (err, result) {
            if (err) {
                // throw err;
                console.error('Item Not Saved');
            }
            console.log('Item Saved');
        });
    },

    save_hostory: (item) => {
        var values = [
            [item.item_id, item.voter, item.weight, item.status, item.created_at, item.updated_at],
        ];
        var sql = `INSERT INTO vote_histories (item_id, voter, weight, status, created_at, updated_at) VALUES ?`;
        db_con.query(sql, [values], function (err, result) {
            if (err) {
                // throw err;
                console.error('History Item Not Saved');
            }
            console.log('Item', item.item_id, "Voted by", item.voter, "Status", item.status);
        });
    },

    set_status: (item_id, status, internal = false) => {
        updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
        var sql = `UPDATE steem_vote_lists SET status = ${status}, updated_at = '${updated_at}' WHERE id = ${item_id} AND status <> 1`;
        db_con.query(sql, function (err, result) {
            if (err != null) {
                // throw err;
                if (internal == false) {
                    console.error('Status Not Updated');
                }
            }
            if (internal == false) {
                console.log("Item", item_id, "Status Updated to", status);
            }
        });
    },

    set_all_done: (start_id, end_id) => {
        for (i = start_id; i <= end_id; i++) {
            module.exports.set_status(i, 1, true);
        }
    },

    comment_status: (item, voter) => {
        updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
        var sql = `UPDATE steem_vote_lists SET commented = 1, updated_at = '${updated_at}' WHERE item_id = ${item.id} AND voter = '${voter.username}'`;
        db_con.query(sql, function (err, result) {
            if (err != null) {
                // throw err;
                console.error('Comment Status Not Updated');
            }
            console.log("Item", item.id, "'commented' Updated");
        });
    },
};