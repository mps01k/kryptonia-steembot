var steem = require('steem');
var store = require('store2');
var moment = require('moment');

var getter = require('./../model/getter.js');
var config = require('./../../config.json');

module.exports = {
    set_it: (key, data, clear = false) => {
        if (clear == true) {
            store(false);
        }
        store.set('clipboard', data, true);
    },

    get_it: (key = 'clipboard') => {
        return store.get(key);
    },

    get_all_post: (callback) => {
        console.log('--> Request from get-all-post');
        getter.get_all_post(function (result) {
            if (result != 'none') {
                callback(result);
            } else {
                callback("Empty");
            }
        });
    },

    get_posts_by_status: (status, callback) => {
        console.log('--> Request for status', status);
        getter.get_posts_by_status(status, function (result) {
            if (result != 'none') {
                callback(result);
            } else {
                callback("Empty");
            }
        });
    },

    get_voting_history: (callback) => {
        console.log('--> Request from voting-history');
        getter.get_voting_history(function (result) {
            if (result != 'none') {
                callback(result);
            } else {
                callback("Empty");
            }
        });
    },

    search_post: (value, callback) => {
        console.log('--> Searching Post', value);
        getter.search_post(value, function (result) {
            if (result != 'none') {
                callback(result);
            } else {
                callback("No Match");
            }
        });
    },

    search_history: (value, callback) => {
        console.log('--> Searching History', value);
        getter.search_history(value, function (result) {
            if (result != 'none') {
                callback(result);
            } else {
                callback("No Match");
            }
        });
    },

    get_item_detail: (item_id, callback) => {
        console.log('--> Getting Details');
        getter.get_detail(item_id, function (result) {
            if (result != 'none') {
                getter.get_histories(item_id, function (result2) {
                    if (result2 != 'none') {
                        ret = {
                            detail: result,
                            histories: result2
                        }
                        callback(ret);
                    } else {
                        ret = {
                            detail: result,
                            histories: null
                        }
                        callback(ret);
                    }
                });
            } else {
                callback("Not Found");
            }
        });
    },

    get_voters_lists: (callback) => {
        console.log('--> Getting Voters List');
        getter.get_voters_lists(function(result) {
            if (result != 'none') {
                callback(result2);
            } else {
                callback('Empty');
            }
        });
    },

    attempt: (username, epassword, callback) => {
        console.log('--> Attempting to login');
        password = module.exports.epass_to_pass(epassword);
        getter.match_credentials(username, password, function (result) {
            if (result == 'none') {
                callback('Credentials Not Matched');
            } else {
                callback({
                    username: result.username,
                    epass: module.exports.encode_ep(result.username + ':' + result.password)
                });
            }
        });
    },

    authenticate: (username, ep, callback) => {
        console.log('Trying to Authenticate');
        getter.check_credentials(username, function(res) {
            console.error(username, res);
            if (res == 'not-found') {
                callback('invalid');
            } else {
                console.log('found');
                if (module.exports.encode_ep(username + ':' + res.password) == ep) {
                    callback('valid');
                } else {
                    callback('invalid');
                }
            }
        });
    },

    encode_ep(str) {
        str = str + config.options.salt;
        var base = Buffer.from(str).toString('base64');
        return base;
    }, 

    decode_ep(base) {
        var str = Buffer.from(base, 'base64').toString();
        str = str.substring(0, str.length - config.options.salt.length);
        return str;
    },

    epass_to_pass(epass) {
        pass = module.exports.decode_ep(epass);
        pass = pass.substring(pass.indexOf(':') + 1);
        return pass;
    },
};