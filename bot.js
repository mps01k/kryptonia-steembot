var http = require('http');
var https = require('https');
var window = require('window');
var jquery = require('jquery');
var express = require('express');
var cors = require('cors');

var config = require('./config.json');
var fetcher = require('./app/controller/fetcher.js');
var voter = require('./app/controller/voter.js');
var salvager = require('./app/controller/salvager.js');
var api = require('./app/controller/api.js');

var getter = require('./app/model/getter.js');

var voters = require('./voters.json');

(function (w, $) {
    var host = config.account.host;
    var email = config.account.email;
    var password = config.account.password;

    w.init = (offset, is_voting, post_data) => {
        if (is_voting == 1) {
            console.log("Start Voting");
            setTimeout(function () {
                posts = post_data.posts;
                s_voters = voters.users;
                total_round = posts.length * s_voters.length;
                if (total_round > 0) {
                    voter.start_voting_process(post_data, function (return_data) {
                        round = return_data.round;
                        posts = return_data.posts;
                        post_index = return_data.post_index;
                        voter_index = return_data.voter_index;
                        if (round <= total_round) {
                            console.info("Round #", round, "of", total_round, "post_index", post_index, "voter_index", voter_index);
                            post_data = {
                                posts: posts,
                                post_index: post_index,
                                voter_index: voter_index,
                                round: round,
                            };
                            w.init(0, 1, post_data);
                        } else {
                            console.log('Voting Done');
                            setTimeout(function () {
                                w.init(0, 0, null);
                            }, 5000);
                        }
                    });
                    return;
                } else {
                    console.log('Nothing to Vote');
                    setTimeout(function () {
                        w.init(0, 0, null);
                    }, 5000);
                    return;
                }
            }, 5000);
            return;
        } else if (is_voting == 2) {
            console.log("Start Salvage Voting");
            salvager.salvage_candidate(function (s_result) {
                if (s_result == 'all-done') {
                    console.log('Salvage Voting Done');
                    setTimeout(function () {
                        w.init(0, 0, null);
                    }, 5000);
                } else {
                    getter.get_post_item(s_result.item_id, function (g_res) {
                        voter_list = voters.users;
                        voter_list.forEach((val, key) => {
                            if (val.username == g_res.voter) {
                                voter.get_permalink(g_res.link, function (permalink) {
                                    item = {
                                        id: g_res.id,
                                        task_id: g_res.task_id,
                                        author: g_res.author,
                                        permalink: permalink,
                                    };
                                    voter = {
                                        username: val.username,
                                        password: val.password
                                    };
                                    voter.vote_it(item, voter, s_result.weight, function (v_res) {
                                        console.log("Salvage Voting:", v_res);
                                        setTimeout(function () {
                                            w.init(0, 2, null);
                                        }, 5000);
                                    });
                                });
                            }
                        });
                        setInterval(function () {
                            w.init(0, 0, null);
                        }, 1000);
                    });
                }
            });
        } else {
            console.info("Offset", offset);
            fetcher.fetch_tasks(host, offset, function (result) {
                if (parseInt(result.partial_count) > 0) {
                    w.init(parseInt(result.offset) + parseInt(result.partial_count), 0, null);
                } else {
                    console.log("Nothing to Fetch Start Voting Phase");
                    getter.get_all_unvoted(function (q_result) {
                        if (q_result == 'all-done') {
                            setTimeout(function () {
                                w.init(0, 2, null);
                            }, 5000);
                        } else {
                            posts = q_result;
                            post_data = {
                                posts: posts,
                                post_index: 0,
                                voter_index: 0,
                                round: 1,
                            };
                            setTimeout(function () {
                                w.init(0, 1, post_data);
                            }, 5000);
                        }
                    });
                }
            });
            return;
        }
    };

    w.serve_api = (port) => {
        var app = express();
        app.use(cors());

        var server = app.listen(port, function () {
            var host = server.address().address;
            if (host == '::') {
                host = 'localhost';
            }
            var port = server.address().port;

            console.log("Serving on http://" + host + ":" + port);
        });

        app.get('/api/get-all-post', function (req, res) {
            api.get_all_post(function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-voted', function (req, res) {
            api.get_posts_by_status(1, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-unvoted', function (req, res) {
            api.get_posts_by_status(0, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-invalid-link', function (req, res) {
            api.get_posts_by_status(2, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-low-reputation', function (req, res) {
            api.get_posts_by_status(3, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-old-post', function (req, res) {
            api.get_posts_by_status(4, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-errored', function (req, res) {
            api.get_posts_by_status(5, function (result) {
                res.json(result);
            });
        });

        app.get('/api/voting-history', function (req, res) {
            api.get_voting_history(function (result) {
                res.json(result);
            });
        });
    };

    /**
     * initiation after running
     * 
     * node voter.js
     */
    offset = 0;
    // w.init(offset);
    w.init(offset, 0, null);
    w.serve_api(1433);
})(window, jquery);