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
    // steem.api.setOptions({ url: 'wss://ws.golos.io' }); // assuming websocket is work at ws.golos.io
    // steem.config.set('address_prefix', 'GLS');
    // steem.config.set('chain_id', '782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');

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
            console.log("Latest Fetched (task_id): " + latest);
            w.getTaskList(latest);
        });
    };

    w.getTaskList = function (latest) {
        axios({
                url: host + '/api/get-list-for-bot',
                method: 'POST',
                responseType: 'json',
                data: {
                    email: email,
                    password: password,
                    latest: latest,
                }
            })
            .then(function (res) {
                $data = res.data.list.data;
                $voter = res.data.voter;
                if ($data.length > 0) {
                    $data.forEach(element => {
                        w.save_to_db(element);
                    });
                    console.log("Records Saved");
                } else {
                    console.log("No Record Fetched");
                }
                w.start_voting($voter);
                setTimeout(function () {
                    w.init();
                }, 10000);
                // w.init();
            })
            .catch(function (err) {
                // console.error(err);
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

    w.get_vote_candidate = function (callback) {
        var sql = `SELECT * FROM steem_vote_lists WHERE status = 0 LIMIT 1`;
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (result.length == 0) {
                callback({
                    msg: "No available item to vote",
                    status: 400
                });
            } else {
                callback({
                    data: result[0],
                    status: 200
                });
            }
        });
    };

    w.update_candidate_status = function (id, voter, status = 1) {
        console.log('Passed Item ID: ' + id);
        var sql = `UPDATE steem_vote_lists SET status = ${status}, voter = '${voter.username}', weight = '${voter.weight}' WHERE id = ${id}`;
        db_con.query(sql, function (err, result, fields) {
            if (err) {
                throw err;
            }
            if (status == 1) {
                console.log('Steem Blog Voted');
            } else {
                console.log('Skipped for voting');
            }
        });
    };

    w.start_voting = function (voter) {
        if (voter.multi == 0) {
            w.get_vote_candidate(function (result) {
                if (result.status == 200) {
                    console.log("Currently on voting que: TaskID-", result.data.task_id);
                    var item = {
                        username: voter.username,
                        password: voter.password,
                        author: result.data.author,
                        permalink: result.data.permalink,
                        weight: voter.weight,
                        item_id: result.data.id,
                    };
                    w.vote_it(item, function (response) {
                        if (response.status == 200) {
                            w.update_candidate_status(item.item_id, voter, 1);
                        } else {
                            w.update_candidate_status(item.item_id, voter, 2);
                            console.log(response.msg);
                        }
                    });
                } else {
                    console.log(result.msg);
                }
            });
        } else {

        }
    };

    w.vote_it = function (item, callback) {
        console.log('New Broadcast on queue, Voter: ' + item.username);
        var wif = steem.auth.toWif(item.username, item.password, 'posting');
        steem.broadcast.vote(wif, item.username, item.author, item.permalink, item.weight, function (err, result) {
            // console.log(err);
            if (err != null) {
                callback({
                    msg: "Not Voted",
                    status: 400
                });
            } else {
                callback({
                    msg: "Voted",
                    status: 200
                });
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