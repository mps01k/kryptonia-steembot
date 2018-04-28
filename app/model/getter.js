var mysql = require('mysql');

var config = require('./../../config.json');

var db_con = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
});

module.exports = {
    check_if_present: (url, callback) => {
        var values = [
            url
        ];
        var sql = `SELECT * FROM steem_vote_lists WHERE link = ?`;
        db_con.query(sql, [values], function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback('not-found');
            } else {
                callback('found');
            }
        });
    },

    get_post_item: (id, callback) => {
        var sql = `SELECT * FROM steem_vote_lists WHERE id = ${id}`;
        db_con.query(sql, [values], function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback('not-found');
            } else {
                callback(result[0]);
            }
        });
    },

    get_all_unvoted: (callback) => {
        var sql = `SELECT * FROM steem_vote_lists WHERE status = 0`;
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback('all-done');
            } else {
                callback(result);
            }
        });
    },

    get_all_post: (callback) => {
        var sql = `SELECT * FROM steem_vote_lists`;
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback('all-done');
            } else {
                callback(result);
            }
        });
    },

    get_voting_history: (callback) => {
        var sql = `SELECT * FROM vote_histories`;
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback('none');
            } else {
                callback(result);
            }
        });
    },

    get_errored_vote: (callback) => {
        var sql = `SELECT * FROM vote_histories WHERE status = 0 LIMIT 1`;
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback('none');
            } else {
                callback(result[0]);
            }
        });
    },

    get_posts_by_status: (status, callback) => {
        /**
         * legends
         * 0 - unvoted
         * 1 - voted
         * 2 - invalid link
         * 3 - author low reputation score
         * 4 - older 7 days
         * 5 - error in voting
         * 6 - blocklisted
         */
        var sql = `SELECT * FROM steem_vote_lists WHERE status = ${status}`;
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback('none');
            } else {
                callback(result);
            }
        });
    }
};