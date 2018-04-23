var steem = require('steem');
steem.api.setOptions({
    url: 'https://api.steemit.com'
});
steem.config.set('address_prefix', 'STM');

var getter = require('./../model/getter.js');
var setter = require('./../model/setter.js');

var voters = require('./../../voters.json');

var fetcher = require('./fetcher.js');

module.exports = {
    prepare: (callback) => {
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
                    while (counter < $voters_count) {
                        for (post_index = 0; post_index < $posts_count; post_index++) {
                            console.log('Round #', round_counter, 'post', post_index, 'voter', voter_index);
                            weight = {
                                max_weight: voters.max_weight,
                                min_weight: voters.min_weight
                            };
                            tags = voters.tags;
                            module.exports.validate_post($posts[parseInt(post_index)], $voters[parseInt(voter_index)], weight, tags, function (res) {
                                console.log(res);
                            });
                            round_counter++;
                            voter_index++;
                            if (voter_index == $voters_count) {
                                voter_index = 0;
                            }
                        }
                        counter++;
                        if (counter == $voters_count) {
                            setTimeout(function () {
                                callback('done');
                            }, 10000);
                        }
                    }
                }
            });
        } else {
            console.error("No Voters");
            callback('done');
        }
    },

    validate_post: (post, voter, weight, tags, callback) => {
        module.exports.get_permalink(post.link, function (permalink) {
            if (permalink != 'Invalid Link') {
                steem.api.getContent(author, permalink, function (err, res) {
                    if (err != null) {
                        callback('Invalid Link');
                    } else {
                        module.exports.reputation_score(res.author_reputation, function (score) {
                            if (score > 25) {
                                $meta = JSON.parse(res.json_metadata).tags;
                                $meta.forEach(tag => {
                                    item = {
                                        author: author,
                                        permalink: permalink,
                                    };
                                    if (tags.indexOf(tag) >= 0) {
                                        // module.exports.vote_it(item, voter, weight.max_weight, function () {

                                        // });
                                    } else {
                                        // module.exports.vote_it(item, voter, weight.min_weight, function () {

                                        // });
                                    }
                                });
                                callback("Voted");
                            } else {
                                setter.set_status(3);
                                callback('Author got Low Reputation Score');
                            }
                        });
                    }
                });
            } else {
                setter.set_status(2);
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
        score = Math.log10(raw);
        score = ((score - 9) * 9) + 25;
        score = Math.floor(score);
        callback(score);
    },

    vote_it: (item, voter, weight, callback) => {
        console.log("Voting TaskID:", item.task_id);
        var wif = steem.auth.toWif(voter.username, voter.password, 'posting');
        steem.broadcast.vote(wif, voter.username, item.author, item.permalink, weight, function (err, result) {
            // console.log(err);
            if (err != null) {
                callback('Not Voted');
            } else {
                new_item = {
                    item_id: item.id,
                    voter: voter.username,
                    weight: weight,
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                };
                setter.save_hostory(new_item);
                callback('Voted');
            }
        });
    }
};