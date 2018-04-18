var http = require('http');
var https = require('https');
var window = require('window');
var jquery = require('jquery');
var axios = require('axios');
var mysql = require('mysql');
var steem = require('steem');

(function (w, $) {
    var host = 'http://localhost:8000';
    var email = "gabrielarlo11@gmail.com";
    var password = "password";

    w.last_task_id = null;

    var db_con = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'steembot'
    });

    w.init = function () {
        console.log("Host: " + host);
        w.get_last_recorded(function (latest) {
            w.getTaskList(latest);
        });
    };

    w.getTaskList = function (latest) {
        axios({
                url: host + '/api/test',
                method: 'POST',
                responseType: 'json',
                data: {
                    email: email,
                    password: password,
                    latest: latest,
                }
            })
            .then(function (res) {
                $data = res.data.data;
                if ($data.length > 0) {
                    $data.forEach(element => {
                        w.save_to_db(element);
                    });
                    console.log("Records Saved");
                    w.init();
                }
                console.log("No Record Fetched");
                w.init();
            })
            .catch(function (err) {
                console.error(err);
            });
        return (false);
    };

    w.save_to_db = function (element) {
        var values = [
            [element.task_id, element.voter, element.author, element.permalink, element.weight, element.by_bot, element.status, element.counter, element.created_at, element.updated_at],
        ];
        var sql = `INSERT INTO steem_vote_lists (task_id, voter, author, permalink, weight, by_bot, status, counter, created_at, updated_at) VALUES ?`;
        db_con.query(sql, [values], function (err, result) {
            if (err) {
                throw err;
            }
            console.log('row inserted');
        });
    };

    w.get_last_recorded = function (callback) {
        var sql = `SELECT task_id FROM steem_vote_lists ORDER BY id DESC LIMIT 1`;
        db_con.query(sql, function (err, result, fields) {
            latest = 'pass';
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback(result.length)
            } else {
                callback(result[0].task_id);
            }
        });
    };

    w.vote_item = function (callack) {
        console.log('New Broadcast on queue');
        var wif = steem.auth.toWif($data.username, $data.password, 'posting');
        steem.broadcast.vote(wif, $data.username, $data.author, $data.permalink, $data.weight, function (err, result) {
            // console.log(err, result);
            if ($data.part == $data.total) {
                returnResult($data._token, $data.record_id, $data.total);
            }
        });
    };

    /**
     * initiation after running
     * 
     * node voter.js
     */
    w.init();
})(window, jquery);