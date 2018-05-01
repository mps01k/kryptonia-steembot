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
};