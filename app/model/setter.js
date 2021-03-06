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
                console.error('Item Not Saved');
                throw err;
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
                            console.error('History Item Not Saved');
                            throw err;
                        }
                        if (item.status == 1) {
                            module.exports.query(`SELECT id FROM vote_histories WHERE item_id = ${item.item_id}`, function (get_err, get_res) {
                                new_count = get_res.length;
                                total = voters.users.length;
                                module.exports.query(`UPDATE steem_vote_lists SET current_votes = ${new_count}, total_voters = ${total}, updated_at = '${item.updated_at}' WHERE id = ${item.item_id}`, function (err1, res1) {
                                    if (err1 == null) {
                                        console.log('Current Count Updated');
                                    }
                                });
                            });
                        } else {
                            total = voters.users.length;
                            module.exports.query(`UPDATE steem_vote_lists SET total_voters = ${total}, updated_at = '${item.updated_at}' WHERE id = ${item.item_id}`, function (err1, res1) {
                                if (err1 == null) {
                                    console.log('Current Total Updated');
                                }
                            });
                        }
                        console.log('[INSERT] Item', item.item_id, "Voted by", item.voter, "Status", item.status);
                    });
                } else {
                    if (item.status == 1) {
                        id = res[0].id;
                        var sql = `UPDATE vote_histories SET status = 1, weight = ${item.weight} WHERE id = ${id}`;
                        db_con.query(sql, function (err2, result) {
                            if (err2) {
                                console.error('History Item Not Saved');
                                throw err;
                            }
                            module.exports.query(`SELECT id FROM vote_histories WHERE item_id = ${item.item_id}`, function (get_err, get_res) {
                                new_count = get_res.length;
                                total = voters.users.length;
                                module.exports.query(`UPDATE steem_vote_lists SET current_votes = ${new_count}, total_voters = ${total}, updated_at = '${item.updated_at}' WHERE id = ${item.item_id}`, function (err1, res1) {
                                    if (err1 == null) {
                                        console.log('Current Count Updated');
                                    }
                                });
                            });
                            console.log('[UPDATE] Item', item.item_id, "Voted by", item.voter, "Status", item.status);
                        });
                    } else {
                        total = voters.users.length;
                        module.exports.query(`UPDATE steem_vote_lists SET total_voters = ${total}, updated_at = '${item.updated_at}' WHERE id = ${item.item_id}`, function (err1, res1) {
                            if (err1 == null) {
                                console.log('Current Total Updated');
                            }
                        });
                    }
                }
            }
        });
    },

    set_history_status: (id, status) => {
        updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
        var sql2 = `UPDATE vote_histories SET status = ${status}, updated_at = '${updated_at}' WHERE id = ${id}`;
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
                if (internal == false) {
                    console.error('Status Not Updated');
                }
                throw err;
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
        module.exports.query(`SELECT * FROM vote_histories WHERE item_id = ${item_id} AND voter = '${voter}' LIMIT 1`, (err, res) => {
            if (err == null) {
                updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
                if (res.length == 0) {
                    var sql = `INSERT INTO vote_histories SET item_id = ${item_id}, voter = '${voter}', commented = 1, updated_at = '${updated_at}', created_at = '${updated_at}'`;
                    db_con.query(sql, function (err1, result) {
                        if (err1 != null) {
                            console.error('Comment Status Not Added');
                            throw err;
                        } else {
                            item = {
                                item_id: item_id,
                                voter: voter,
                                status: 0,
                                created_at: updated_at,
                                updated_at: updated_at
                            };
                            module.exports.save_history(item);
                            console.log("Item", item_id, "'commented' Added");
                        }
                    });
                } else {
                    var sql = `UPDATE vote_histories SET commented = 1, updated_at = '${updated_at}' WHERE id = ${res[0].id}`;
                    db_con.query(sql, function (err1, result) {
                        if (err1 != null) {
                            console.error('Comment Status Not Updated');
                            throw err;
                        } else {
                            console.log("Item", item_id, "'commented' Updated");
                        }
                    });
                }
            } else {
                throw err;
            }
        });
    },

    query: (sql, callback) => {
        db_con.query(sql, function (err, result) {
            callback(err, result);
        });
    },
};