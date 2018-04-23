var express = require('express');
var window = require('window');
var mysql = require('mysql');
var app = express();

var config = require('./config.json');

var server = app.listen(3000, function () {
    var host = server.address().address;
    if (host == '::') {
        host = 'localhost';
    }
    var port = server.address().port;

    console.log("Serving on http://" + host + ":" + port);
});

(function (w) {
    app.get('/get-all-post', function (req, res) {
        console.log('Request from get-all-post');
        w.getAllPost(function (result) {
            res.json(result);
        });
    });

    app.get('/get-all-voted', function (req, res) {
        console.log('Request from get-all-voted');
        w.getAllPost('voted', function (result) {
            res.json(result);
        });
    });

    app.get('/get-all-unvoted', function (req, res) {
        console.log('Request from get-all-unvoted');
        w.getAllPost('unvoted', function (result) {
            res.json(result);
        });
    });

    var db_con = mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database
    });

    w.getAllPost = (part = 'all', callback) => {
        var sql = `SELECT * FROM steem_vote_lists`;
        if (part == 'voted') {
            sql = `SELECT * FROM steem_vote_lists WHERE status = 1`;
        } else if (part == 'unvoted') {
            sql = `SELECT * FROM steem_vote_lists WHERE status = 0`;
        }
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            callback(result);
        });
    };
})(window);