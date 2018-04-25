var http = require('http');
var https = require('https');
var window = require('window');
var jquery = require('jquery');

var config = require('./config.json');
var fetcher = require('./app/controller/fetcher.js');
var voter = require('./app/controller/voter.js');
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
                            }, 1000);
                        }
                    });
                    return;
                } else {
                    console.log('Nothing to Vote');
                    setTimeout(function () {
                        w.init(0, 0, null);
                    }, 2000);
                    return;
                }
            }, 5000);
            return;
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
                                w.init(0, 0, null);
                            }, 3000);
                        } else {
                            posts = q_result;
                            post_data = {
                                posts: posts,
                                post_index: 0,
                                voter_index: 0,
                                round: 1,
                            };
                            w.init(0, 1, post_data);
                        }
                    });
                }
            });
            return;
        }
    };

    /**
     * initiation after running
     * 
     * node voter.js
     */
    offset = 0;
    // w.init(offset);
    w.init(offset, 0, null);
})(window, jquery);