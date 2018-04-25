var steem = require('steem');
var store = require('store2');
var moment = require('moment');

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
};