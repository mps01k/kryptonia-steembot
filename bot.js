var http = require('http');
var https = require('https');
var window = require('window');
var jquery = require('jquery');

var config = require('./config.json');
var fetcher = require('./app/controller/fetcher.js');
var voter = require('./app/controller/voter.js');

(function (w, $) {
    var host = config.account.host;
    var email = config.account.email;
    var password = config.account.password;

    w.last_task_id = null;

    w.init = (offset) => {
        console.info("Offset", offset);
        fetcher.fetch_tasks(host, offset, function (result) {
            if (parseInt(result.partial_count) > 0) {
                w.init(parseInt(result.offset) + parseInt(result.partial_count));
            } else {
                console.log("Start Voting");
                voter.prepare(function (status) {
                    if (status == 'done') {
                        console.log('Voting Done');
                        setTimeout(function () {
                            w.init(result.offset);
                        }, 5000);
                    }
                });
            }
        });
    };

    /**
     * initiation after running
     * 
     * node voter.js
     */
    offset = 0;
    w.init(offset);
})(window, jquery);