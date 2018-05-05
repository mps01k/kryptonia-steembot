var mysql = require('mysql');
var moment = require('moment');

var config = require('./../../config.json');
var voters = require('./../../voters.json');

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

    save_history: (item) => {
        var sql1 = `SELECT * FROM vote_histories WHERE item_id = ${item.item_id} AND voter = '${item.voter}'`;
        db_con.query(sql1, function (err, res) {
            if (err == null) {
                if (res.length == 0) {
                    var values = [
                        [item.item_id, item.voter, item.weight, item.status, item.created_at, item.updated_at],
                    ];
                    var sql = `INSERT INTO vote_histories (item_id, voter, weight, status, created_at, updated_at) VALUES ?`;
                    db_con.query(sql, [values], function (err2, result) {
                        if (err2) {
                            // throw err;
                            console.error('History Item Not Saved');
                        }
                        if (item.status == 1) {
                            module.exports.query(`SELECT * FROM steem_vote_lists WHERE id = ${item.item_id} LIMIT 1`, function (get_err, get_res) {
                                new_count = get_res[0].current_votes + 1;
                                total = voters.users.length;
                                module.exports.query(`UPDATE steem_vote_lists SET current_votes = ${new_count}, total_voters = ${total} WHERE id = ${get_res[0].id}`, function (err1, res1) {
                                    if (err1 == null) {
                                        console.log('Current Count Updated');
                                    }
                                });
                            });
                        }
                        console.log('[INSERT] Item', item.item_id, "Voted by", item.voter, "Status", item.status);
                    });
                } else {
                    if (item.status == 1) {
                        id = res[0].id;
                        var sql = `UPDATE vote_histories SET status = 1 WHERE id = ${id}`;
                        db_con.query(sql, function (err2, result) {
                            if (err2) {
                                // throw err;
                                console.error('History Item Not Saved');
                            }
                            module.exports.query(`SELECT * FROM steem_vote_lists WHERE id = ${item.item_id} LIMIT 1`, function (get_err, get_res) {
                                new_count = get_res[0].current_votes + 1;
                                total = voters.users.length;
                                module.exports.query(`UPDATE steem_vote_lists SET current_votes = ${new_count}, total_voters = ${total} WHERE id = ${get_res[0].id}`, function (err1, res1) {
                                    if (err1 == null) {
                                        console.log('Current Count Updated');
                                    }
                                });
                            });
                            console.log('[UPDATE] Item', item.item_id, "Voted by", item.voter, "Status", item.status);
                        });
                    }
                }
            }
        });
    },

    set_history_status: (id, status) => {
        var sql2 = `UPDATE vote_histories SET status = ${status} WHERE id = ${id}`;
        db_con.query(sql2, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                console.error("Failed to prepare for salvage voting. History ID:", id);
            } else {
                console.log("Prepared for Salvage Voting");
            }
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

    comment_status: (item_id, voter) => {
        updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
        var sql = `UPDATE steem_vote_lists SET commented = 1, updated_at = '${updated_at}' WHERE item_id = ${item_id} AND voter = '${voter}'`;
        db_con.query(sql, function (err, result) {
            if (err != null) {
                // throw err;
                console.error('Comment Status Not Updated');
            }
            console.log("Item", item.id, "'commented' Updated");
        });
    },

    query: (sql, callback) => {
        db_con.query(sql, function (err, result) {
            callback(err, result);
        });
    },
};