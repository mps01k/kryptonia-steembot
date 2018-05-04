var http = require('http');
var https = require('https');
var window = require('window');
var jquery = require('jquery');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var api = require('./app/controller/api.js');

var getter = require('./app/model/getter.js');

(function (w, $) {
    w.serve_api = (port) => {
        var app = express();
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        var server = app.listen(port, function () {
            var host = server.address().address;
            if (host == '::') {
                host = 'localhost';
            }
            var port = server.address().port;

            console.log("Serving on http://" + host + ":" + port);
        });

        app.get('/api/get-all-post', function (req, res) {
            api.get_all_post(function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-voted', function (req, res) {
            api.get_posts_by_status(1, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-pending', function (req, res) {
            api.get_posts_by_status(0, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-invalid-link', function (req, res) {
            api.get_posts_by_status(2, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-low-reputation', function (req, res) {
            api.get_posts_by_status(3, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-old-post', function (req, res) {
            api.get_posts_by_status(4, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-error', function (req, res) {
            api.get_posts_by_status(5, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-all-blocked', function (req, res) {
            api.get_posts_by_status(6, function (result) {
                res.json(result);
            });
        });

        app.get('/api/voting-history', function (req, res) {
            api.get_voting_history(function (result) {
                res.json(result);
            });
        });

        app.post('/api/search-post', function (req, res) {
            api.search_post(req.body.value, function (result) {
                res.json(result);
            });
        });

        app.post('/api/search-history', function (req, res) {
            api.search_history(req.body.value, function (result) {
                res.json(result);
            });
        });

        app.post('/api/get-item-detail', function (req, res) {
            api.get_item_detail(req.body.id, function (result) {
                res.json(result);
            });
        });

        app.get('/api/get-voters-list', function (req, res) {
            api.authenticate(req.headers.username, req.headers.authorization, function(result) {
                if (result == 'valid') {
                    api.get_voters_lists(function(result2) {
                        res.json(result2);
                    });
                } else {
                    res.json('Not Authenticated');
                }
            });
        });

        app.post('/api/login', function (req, res) {
            api.attempt(req.body.username, req.body.epass, function(result) {
                res.json(result);
            });
        });
    };

    /**
     * initiation after running
     * 
     * node bot_api.js
     */
    w.serve_api(1433);
})(window, jquery);