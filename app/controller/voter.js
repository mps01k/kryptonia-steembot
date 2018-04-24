var steem = require('steem');
var moment = require('moment');

steem.api.setOptions({
    url: 'https://api.steemit.com'
});
steem.config.set('address_prefix', 'STM');

var getter = require('./../model/getter.js');
var setter = require('./../model/setter.js');

var voters = require('./../../voters.json');

var fetcher = require('./fetcher.js');

module.exports = {
    prepare: (initial, callback) => {
        users = voters.users;
        if (users.length > 0) {
            getter.get_all_unvoted(function (res) {
                if (res == 'all-done') {
                    callback('done');
                } else {
                    $posts = [];
                    i = 0;
                    res.forEach((element) => {
                        $posts.push({
                            id: element.id,
                            task_id: element.task_id,
                            author: element.author,
                            link: element.link,
                            by_bot: element.by_bot,
                            status: element.status,
                            created_at: element.created_at,
                            updated_at: element.updated_at
                        });
                    });
                    $voters = users;
                    $voters_count = users.length;
                    $posts_count = res.length;
                    counter = 0;
                    voter_index = 0;
                    round_counter = 1;
                    start_time = moment().add(1, 'millisecond').unix();
                    while (counter < $voters_count) {
                        now_unix_1 = moment().unix();
                        if (start_time >= now_unix_1) {
                            // break;
                        } else {
                            post_index = 0;
                            start_time = moment().add(1, 'millisecond').unix();
                            while (post_index < $posts_count) {
                                now_unix_2 = moment().unix();
                                if (start_time >= now_unix_2) {
                                    // break;
                                } else {
                                    console.info('Round #', round_counter, 'post_index', post_index, 'voter_index', voter_index);
                                    weight = {
                                        max_weight: voters.max_weight,
                                        min_weight: voters.min_weight
                                    };
                                    tags = voters.tags;
                                    module.exports.validate_post($posts[parseInt(post_index)], $voters[parseInt(voter_index)], weight, tags, counter, function (res) {
                                        console.log(res);
                                    });
                                    round_counter++;
                                    voter_index++;
                                    post_index++;
                                    start_time = moment().add(5, 'seconds').unix();
                                    if (voter_index == $voters_count) {
                                        voter_index = 0;
                                    }
                                }
                            }
                            counter++;
                            if (counter == $voters_count) {
                                setTimeout(function () {
                                    // setter.set_all_done($posts[parseInt(post_index)].id, $posts[parseInt($posts_count) - 1].id);
                                    callback('done');
                                }, 5000);
                            }
                        }
                    }
                }
            });
        } else {
            console.error("No Voters");
            callback('done');
        }
    },

    validate_post: (post, voter, weight, tags, counter, callback) => {
        console.info("Post Validation for counter", counter);
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
                                    $meta = JSON.parse(res1.json_metadata).tags;
                                    item = {
                                        id: post.id,
                                        task_id: post.task_id,
                                        author: post.author,
                                        permalink: permalink,
                                    };
                                    set = 0;
                                    if ($meta.length > 0) {
                                        found = 0;
                                        $meta.forEach((tag) => {
                                            if (tags.indexOf(tag) >= 0) {
                                                found = 1;
                                            }
                                            set++;
                                        });
                                        if (found == 1 & set == $meta.length) {
                                            console.info("Max Voting");
                                            module.exports.vote_it(item, voter, weight.max_weight, function (res2) {
                                                if (counter == 0) {
                                                    console.info("Commenting for Max");
                                                    module.exports.comment_to_it(item, voter, 'max', function (response) {
                                                        console.log(response);
                                                    });
                                                }
                                                callback(res2);
                                            });
                                        } else if (found == 0 & set == $meta.length) {
                                            console.info("Min Voting");
                                            module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                                if (counter == 0) {
                                                    console.info("Commenting for Min");
                                                    module.exports.comment_to_it(item, voter, 'min', function (response) {
                                                        console.log(response);
                                                    });
                                                }
                                                callback(res2);
                                            });
                                        }
                                    } else {
                                        console.info("Min Voting");
                                        module.exports.vote_it(item, voter, weight.min_weight, function (res2) {
                                            if (counter == 0) {
                                                console.info("Commenting for Min");
                                                module.exports.comment_to_it(item, voter, 'min', function (response) {
                                                    console.log(response);
                                                });
                                            }
                                            callback(res2);
                                        });
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

1. You run a task on <a href="http://csyd.es/Kryptonia">Kryptonia.io</a> who can get an upvote from the Kryptonia-Steemit bot.
*For those who want to join the growing community, grab your account here: <a href="http://csyd.es/Kryptonia">kryptonia.io</a>.
2. You used the tags <a href="https://steemit.com/trending/kryptonia">KRYPTONIA</a> & <a href="https://steemit.com/trending/superiorcoin">SUPERIORCOIN</a> in your  Steemit post.
3. The Steemit reputation score was above <b>25</b>.`;
            steem.broadcast.comment(wif, parentAuthor, parentPermalink, author, permalink, title, body, jsonMetadata, function (err, result) {
                // console.log(err, result);
                if (err == null) {
                    callback("Not Commented");
                }
                setter.comment_status(item, voter);
                callback("Commented", {
                    author: parentAuthor,
                    permalink: parentPermalink,
                    commenter: author
                });
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
                callback("Commented", {
                    author: parentAuthor,
                    permalink: parentPermalink,
                    commenter: author
                });
            });
        }
    },
};