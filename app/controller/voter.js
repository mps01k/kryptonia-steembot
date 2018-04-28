var steem = require('steem');
var moment = require('moment');
var window = require('window');

steem.api.setOptions({
    url: 'https://api.steemit.com'
});
steem.config.set('address_prefix', 'STM');

var getter = require('./../model/getter.js');
var setter = require('./../model/setter.js');

var voters = require('./../../voters.json');

var fetcher = require('./fetcher.js');
var api = require('./api.js');

module.exports = {
    start_voting_process: (post_data, callback) => {
        posts = post_data.posts;
        post_index = post_data.post_index;
        voter_index = post_data.voter_index;
        round = post_data.round;

        weight = {
            max_weight: voters.max_weight,
            min_weight: voters.min_weight
        };
        tags = voters.tags;
        s_voters = voters.users;
        batch = module.exports.get_batch(round, posts.length);
        module.exports.validate_post(posts[parseInt(post_index)], s_voters[parseInt(voter_index)], weight, tags, batch, function (res) {
            post_index++;
            if (post_index >= posts.length) {
                post_index = 0;
            }
            voter_index++;
            if (voter_index >= s_voters.length) {
                voter_index = 0;
            }
            return_data = {
                posts: posts,
                post_index: post_index,
                voter_index: voter_index,
                round: round + 1,
            };
            if (res == 'validated') {
                console.log("Successfully Voted");                
                callback(return_data);
            } else {
                console.log(res);
                callback(return_data);
            }
        });
    },

    get_batch: (round, posts_count) => {
        if (round <= posts_count) {
            return 1;
        } else {
            current = round / posts_count;
            return Math.ceil(current);
        }
    },

    check_tags: (post_tags, req_tags, callback) => {
        res = 'not_found';
        i = 0;
        post_tags.forEach((tag) => {
            if (req_tags.indexOf(tag) >= 0) {
                res = 'found';
            }
            i++;
        });
        if (i >= post_tags.length) {
            callback(res);
        }
    },

    check_blocked: (block_list, author, callback) => {
        if (block_list.indexOf(author) >= 0) {
            callback('found');
        } else {
            callback('not-found');
        }
    },

    check_prios: (prio_list, author, callback) => {
        if (prio_list.indexOf(author) >= 0) {
            callback('found');
        } else {
            callback('not-found');
        }
    },

    validate_post: (post, voter, weight, tags, batch, callback) => {
        console.info("Post Validation for batch", batch);
        module.exports.get_permalink(post.link, function (permalink) {
            if (permalink != 'Invalid Link') {
                console.info("Getting Post Content", author, permalink);
                steem.api.getContent(author, permalink, function (err, res1) {
                    if (err != null) {
                        callback('Invalid Link');
                    } else {
                        console.info("Checking Post Age");
                        if (moment(res1.created).unix() > moment().subtract(7, "days").unix()) {
                            console.info("Checking Author Reputation Score");
                            module.exports.reputation_score(res1.author_reputation, function (score) {
                                if (score >= 25) {
                                    prio_list = voters.prio;
                                    block_list = voters.blocked;
                                    if (block_list.length > 0) {
                                        module.exports.check_blocked(block_list, author, function (blocked_result) {
                                            if (blocked_result == 'not-found') {
                                                if (prio_list.length > 0) {
                                                    module.exports.check_prios(prio_list, author, function (prio_result) {
                                                        if (prio_result == 'found') {
                                                            console.info("Max Voting [Prio]");
                                                            item = {
                                                                id: post.id,
                                                                task_id: post.task_id,
                                                                author: post.author,
                                                                permalink: permalink,
                                                            };
                                                            module.exports.vote_it(item, voter, weight.max_weight, function (res2) {
                                                                if (batch == 1) {
                                                                    console.info("Commenting for Max");
                                                                    module.exports.comment_to_it(item, voter, 'max', function (response, other) {
                                                                        console.log(res2, response);
                                                                        callback('validated');
                                                                    });
                                                                } else {
                                                                    console.log(res2);
                                                                    callback('validated');
                                                                }
                                                            });
                                                        } else {
                                                            $meta = JSON.parse(res1.json_metadata).tags;
                                                            item = {
                                                                id: post.id,
                                                                task_id: post.task_id,
                                                                author: post.author,
                                                                permalink: permalink,
                                                            };
                                                            if ($meta.length > 0) {
                                                                module.exports.check_tags($meta, tags, function (check_result) {
                                                                    is_found = check_result;
                                                                    console.log("Tag Found?:", is_found);
                                                                    if (is_found == 'found') {
                                                                        console.info("Max Voting");
                                                                        module.exports.vote_it(item, voter, weight.max_weight, function (res2) {
                                                                            if (batch == 1) {
                                                                                console.info("Commenting for Max");
                                                                                module.exports.comment_to_it(item, voter, 'max', function (response, other) {
                                                                                    console.log(res2, response);
                                                                                    callback('validated');
                                                                                });
                                                                            } else {
                                                                                console.log(res2);
                                                                                callback('validated');
                                                                            }
                                                                        });
                                                                    } else {
                                                                        console.info("Min Voting");
                                                                        module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                                                            if (batch == 1) {
                                                                                console.info("Commenting for Min");
                                                                                module.exports.comment_to_it(item, voter, 'min', function (response, other) {
                                                                                    console.log(res2, response);
                                                                                    callback('validated');
                                                                                });
                                                                            } else {
                                                                                console.log(res2);
                                                                                callback('validated');
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            } else {
                                                                console.info("Min Voting");
                                                                module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                                                    if (batch == 1) {
                                                                        console.info("Commenting for Min");
                                                                        module.exports.comment_to_it(item, voter, 'min', function (response, other) {
                                                                            console.log(res2, response);
                                                                            callback('validated');
                                                                        });
                                                                    } else {
                                                                        console.log(res2);
                                                                        callback('validated');
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    $meta = JSON.parse(res1.json_metadata).tags;
                                                    item = {
                                                        id: post.id,
                                                        task_id: post.task_id,
                                                        author: post.author,
                                                        permalink: permalink,
                                                    };
                                                    if ($meta.length > 0) {
                                                        module.exports.check_tags($meta, tags, function (check_result) {
                                                            is_found = check_result;
                                                            console.log("Tag Found?:", is_found);
                                                            if (is_found == 'found') {
                                                                console.info("Max Voting");
                                                                module.exports.vote_it(item, voter, weight.max_weight, function (res2) {
                                                                    if (batch == 1) {
                                                                        console.info("Commenting for Max");
                                                                        module.exports.comment_to_it(item, voter, 'max', function (response, other) {
                                                                            console.log(res2, response);
                                                                            callback('validated');
                                                                        });
                                                                    } else {
                                                                        console.log(res2);
                                                                        callback('validated');
                                                                    }
                                                                });
                                                            } else {
                                                                console.info("Min Voting");
                                                                module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                                                    if (batch == 1) {
                                                                        console.info("Commenting for Min");
                                                                        module.exports.comment_to_it(item, voter, 'min', function (response, other) {
                                                                            console.log(res2, response);
                                                                            callback('validated');
                                                                        });
                                                                    } else {
                                                                        console.log(res2);
                                                                        callback('validated');
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    } else {
                                                        console.info("Min Voting");
                                                        module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                                            if (batch == 1) {
                                                                console.info("Commenting for Min");
                                                                module.exports.comment_to_it(item, voter, 'min', function (response, other) {
                                                                    console.log(res2, response);
                                                                    callback('validated');
                                                                });
                                                            } else {
                                                                console.log(res2);
                                                                callback('validated');
                                                            }
                                                        });
                                                    }
                                                }
                                            } else {
                                                setter.set_status(post.id, 6);
                                                callback('Author is blocklisted');
                                            }
                                        });
                                    } else {
                                        $meta = JSON.parse(res1.json_metadata).tags;
                                        item = {
                                            id: post.id,
                                            task_id: post.task_id,
                                            author: post.author,
                                            permalink: permalink,
                                        };
                                        if ($meta.length > 0) {
                                            module.exports.check_tags($meta, tags, function (check_result) {
                                                is_found = check_result;
                                                console.log("Tag Found?:", is_found);
                                                if (is_found == 'found') {
                                                    console.info("Max Voting");
                                                    module.exports.vote_it(item, voter, weight.max_weight, function (res2) {
                                                        if (batch == 1) {
                                                            console.info("Commenting for Max");
                                                            module.exports.comment_to_it(item, voter, 'max', function (response, other) {
                                                                console.log(res2, response);
                                                                callback('validated');
                                                            });
                                                        } else {
                                                            console.log(res2);
                                                            callback('validated');
                                                        }
                                                    });
                                                } else {
                                                    console.info("Min Voting");
                                                    module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                                        if (batch == 1) {
                                                            console.info("Commenting for Min");
                                                            module.exports.comment_to_it(item, voter, 'min', function (response, other) {
                                                                console.log(res2, response);
                                                                callback('validated');
                                                            });
                                                        } else {
                                                            console.log(res2);
                                                            callback('validated');
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            console.info("Min Voting");
                                            module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                                if (batch == 1) {
                                                    console.info("Commenting for Min");
                                                    module.exports.comment_to_it(item, voter, 'min', function (response, other) {
                                                        console.log(res2, response);
                                                        callback('validated');
                                                    });
                                                } else {
                                                    console.log(res2);
                                                    callback('validated');
                                                }
                                            });
                                        }
                                    }
                                } else {
                                    setter.set_status(post.id, 3);
                                    callback('Author got Low Reputation Score');
                                }
                            });
                        } else {
                            setter.set_status(post.id, 4);
                            callback('Post is Over 7 days old');
                        }
                    }
                });
            } else {
                setter.set_status(post.id, 2);
                callback('Invalid Link');
            }
        });
    },

    get_permalink: (url, callback) => {
        author = fetcher.get_author(url);
        if (author != 'No Author') {
            permalink = url.substring(url.indexOf('@') + 1);
            permalink = permalink.substring(author.length + 1);
            if (permalink.indexOf('#') >= 0) {
                permalink = permalink.substring(0, permalink.indexOf('#'));
            }
            callback(permalink);
        } else {
            callback('Invalid Link');
        }
    },

    reputation_score: (raw, callback) => {
        score = steem.formatter.reputation(raw);
        // score = Math.log10(raw);
        // score = ((score - 9) * 9) + 25;
        // score = Math.floor(score);
        callback(score);
    },

    vote_it: (item, voter, weight, callback) => {
        console.log("Voting TaskID:", item.task_id);
        wif = steem.auth.toWif(voter.username, voter.password, 'posting');
        steem.broadcast.vote(wif, voter.username, item.author, item.permalink, weight, function (err, result) {
            // console.log(err);
            if (err != null) {
                new_item = {
                    item_id: item.id,
                    voter: voter.username,
                    weight: weight,
                    status: 0,
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                };
                setter.save_hostory(new_item);
                setter.set_status(item.id, 5);
                callback('Not Voted');
            } else {
                new_item = {
                    item_id: item.id,
                    voter: voter.username,
                    weight: weight,
                    status: 1,
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                };
                setter.save_hostory(new_item);
                setter.set_status(item.id, 1);
                callback('Voted');
            }
        });
    },

    comment_to_it: (item, voter, weight_type, callback) => {
        wif = steem.auth.toWif(voter.username, voter.password, 'posting');

        parentAuthor = item.author;
        parentPermalink = item.permalink;
        commentPermlink = steem.formatter.commentPermlink(parentAuthor, parentPermalink);

        author = voter.username;
        permalink = commentPermlink;
        title = "Comment from kryptonia.io";
        jsonMetadata = {
            "tags": [
                "kryptonia",
                "superiorcoin",
                "cryptobabe"
            ]
        };

        if (weight_type == 'max') {
            console.info("Max Commenting");
            body = `Congratulations! You got a <b>100% upvote</b> from @kryptonia Steem bot for following the conditions:

1. You ran a task on <a href="http://csyd.es/Kryptonia">Kryptonia.io</a> and got upvoted from the Kryptonia-Steemit bot.
*For those who want to join the growing community, grab your account here: <a href="http://csyd.es/Kryptonia">kryptonia.io</a>.
2. You used the tags <a href="https://steemit.com/trending/kryptonia">KRYPTONIA</a> & <a href="https://steemit.com/trending/superiorcoin">SUPERIORCOIN</a> in your  Steemit post.
3. The Steemit reputation score was above <b>25</b>.`;
            steem.broadcast.comment(wif, parentAuthor, parentPermalink, author, permalink, title, body, jsonMetadata, function (err, result) {
                // console.log(err, result);
                if (err == null) {
                    callback("Not Commented");
                }
                setter.comment_status(item, voter);
                callback("Commented");
            });
        } else if (weight_type == 'min') {
            console.info("Min Commenting");
            body = `Congratulations! You got a <b>10% upvote</b> from @kryptonia Steem bot!  
If you want to get 100% upvote, these are the conditions:

1. Only people who run a task on <a href="http://csyd.es/Kryptonia">Kryptonia.io</a> who can get an upvote from the Kryptonia-Steemit bot.
*If you do not have an account, grab here <a href="http://csyd.es/Kryptonia">kryptonia.io</a>.
2. Users must use the tags <a href="https://steemit.com/trending/kryptonia">KRYPTONIA</a> & <a href="https://steemit.com/trending/superiorcoin">SUPERIORCOIN</a> in their Steemit post.
3. The Steemit reputation score is not below <b>25</b>.`;
            steem.broadcast.comment(wif, parentAuthor, parentPermalink, author, permalink, title, body, jsonMetadata, function (err, result) {
                // console.log(err, result);
                if (err == null) {
                    callback("Not Commented");
                }
                setter.comment_status(item, voter);
                callback("Commented");
            });
        }
    },
};