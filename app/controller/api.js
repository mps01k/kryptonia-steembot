var steem = require('steem');
var store = require('store2');
var moment = require('moment');

var getter = require('./../model/getter.js');

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
};