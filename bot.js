var window = require('window');
var jquery = require('jquery');

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
    var voting_interval = config.options.voting_interval;
    var return_interval = 5000;

    w.init = (offset, is_voting, post_data) => {
        if (is_voting == 1) {
            console.log("Start Voting");
            posts = post_data.posts;
            s_voters = voters.users;
            total_round = posts.length * s_voters.length;
            if (total_round > 0) {
                setTimeout(() => {
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
                            setTimeout(() => {
                                w.init(0, 1, post_data);
                            }, 1000);
                        } else {
                            console.log('Voting Done');
                            setTimeout(() => {
                                w.init(0, 0, null);
                            }, return_interval);
                        }
                    });
                }, voting_interval);
            } else {
                console.log('Nothing to Vote');
                setTimeout(() => {
                    w.init(0, 0, null);
                }, return_interval);
            }
        } else if (is_voting == 2) {
            console.log("Start Salvage Voting");
            salvager.salvage_candidate(function (s_result) {
                if (s_result == 'all-done') {
                    console.log('Salvage Voting Done');
                    setTimeout(() => {
                        w.init(0, 0, null);
                    }, 5000);
                } else {
                    setTimeout(() => {
                        getter.get_post_item(s_result.item_id, function (g_res) {
                            voter_list = voters.users;
                            voter_list.forEach((val, key) => {
                                if (val.username == s_result.voter) {
                                    console.log("Salvage Voting of", s_result.voter, "for ITEM ID", s_result.item_id);
                                    voter.get_permalink(g_res.link, function (permalink) {
                                        item = {
                                            id: g_res.id,
                                            task_id: g_res.task_id,
                                            author: g_res.author,
                                            permalink: permalink,
                                        };
                                        this_voter = {
                                            username: val.username,
                                            password: val.password,
                                            wif: val.wif
                                        };
                                        voter.vote_it(item, this_voter, s_result.weight, function (v_res) {
                                            console.log("Salvage Voting:", v_res);
                                            setTimeout(() => {
                                                w.init(0, 2, null);
                                            }, 5000);
                                        });
                                    });
                                }
                            });
                            setTimeout(() => {
                                w.init(0, 0, null);
                            }, 5000);
                        });
                    }, voting_interval);
                }
            });
        } else {
            console.info("Offset", offset);
            fetcher.fetch_tasks(host, offset, function (result) {
                if (parseInt(result.partial_count) > 0) {
                    setTimeout(() => {
                        w.init(parseInt(result.offset) + parseInt(result.partial_count), 0, null);
                    }, 5000);
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
                            setTimeout(() => {
                                w.init(0, 1, post_data);
                            }, 5000);
                        }
                    });
                }
            });
        }
    };

    /**
     * initiation after running
     * 
     * node bot.js
     */
    offset = 0;
    w.init(offset, 0, null);
})(window, jquery);