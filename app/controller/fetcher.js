var axios = require('axios');
var moment = require('moment');

var getter = require('./../model/getter.js');
var setter = require('./../model/setter.js');

module.exports = {
    fetch_tasks: (host, offset = 0, callback) => {
        axios({
                url: host + '/api/available',
                method: 'POST',
                responseType: 'json',
                data: {
                    offset: offset,
                }
            })
            .then(function (res) {
                $tasks = res.data.task;
                $offset = res.data.offset;
                $count = res.data.count;
                if ($tasks.length > 0) {
                    i = 0;
                    $tasks.forEach((item) => {
                        $checked = module.exports.filter_url(item.task_link);
                        if ($checked == 'good') {
                            getter.check_if_present(item.task_link, function (present) {
                                if (present == 'not-found') {
                                    author = module.exports.get_author(item.task_link);
                                    post = {
                                        task_id: item.id,
                                        author: author,
                                        link: item.task_link,
                                        by_bot: 1,
                                        status: 0,
                                        created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                                        updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                                    };
                                    console.log("Saving Item TaskID", item.id);
                                    setter.save_to_db(post);
                                    i = i + 1;
                                    if (i == $tasks.length) {
                                        callback({
                                            offset: $offset,
                                            partial_count: $tasks.length
                                        });
                                    }
                                } else {
                                    // console.error("Duplicated url TaskID", item.id);
                                    i = i + 1;
                                    if (i == $tasks.length) {
                                        callback({
                                            offset: $offset,
                                            partial_count: $tasks.length
                                        });
                                    }
                                }
                            });
                        } else {
                            // console.error("Invalid url TaskID", item.id);
                            i = i + 1;
                            if (i == $tasks.length) {
                                callback({
                                    offset: $offset,
                                    partial_count: $tasks.length
                                });
                            }
                        }
                    });
                } else {
                    console.log("No New Tasks Fetched");
                    callback({
                        offset: 0,
                        total_count: $count,
                        partial_count: $tasks.length
                    });
                }
            })
            .catch(function (err) {
                // console.error(err);
            });
    },

    filter_url: (url) => {
        if (url.length > 0) {
            if (url.indexOf('https://steemit.com/') >= 0) {
                if (url.indexOf('https://steemit.com/@') < 0) {
                    return 'good';
                }
                return 'bad';
            }
            return 'bad';
        } else {
            return 'bad';
        }
    },

    get_author: (url) => {
        is_good = module.exports.filter_url(url);
        if (is_good == 'good') {
            author = url.substring(url.indexOf('@') + 1);
            author = author.substring(0, author.indexOf('/'));
            return author;
        } else {
            return 'No Author';
        }
    }
};