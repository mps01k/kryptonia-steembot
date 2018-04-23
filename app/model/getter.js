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
    }
};