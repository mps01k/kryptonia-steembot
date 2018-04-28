var getter = require('./../model/getter');

module.exports = {
    salvage_candidate: (callback) => {
        getter.get_errored_vote(function (res) {
            if (res == 'none') {
                callback('all-done');
            } else {
                callback(res);
            }
        });
    },
};