var mysql = require('mysql');

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
            [item.item_id, item.voter, item.weight, item.created_at, item.updated_at],
        ];
        var sql = `INSERT INTO vote_histories (item_id, voter, weight, created_at, updated_at) VALUES ?`;
        db_con.query(sql, [values], function (err, result) {
            if (err) {
                // throw err;
                console.error('History Item Not Saved');
            }
            console.log('Item', item.item_id, "Voted by", item.voter);
        });
    },

    set_status: (item_id, status) => {
        
    }
};