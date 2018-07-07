'use strict';

var Counters = require('../models/counters.js');
var UrlEntries = require('../models/urlEntries.js');
var dns = require('dns');


function getCountAndIncrease(req, res, callback) {
    Counters.findOneAndUpdate({}, {$inc:{'count': 1}}, function(err, data) {
        if (err) return;
        if (data) {
            callback(data.count);
        } else {
            var newCounter = new Counters();
            newCounter.save(function(err) {
                if (err) return;
                Counters.findOneAndUpdate({}, {$inc:{'count': 1}}, function(err, data) {
                    if (err) return;
                    callback(data.count);
                });
            });
        }
    });
}

var protocolRegExg = /^https?:\/\/(.*)/i;

var hostnameRegExp = /^([a-z0-9\-_]+\.)+[a-z0-9\-_]+/i;

exports.addUrl = function (req, res) {
    
    var url = req.body.url;
    if (url.match(/\/$/i)) {
        url = url.slice(0, -1);
    }
    var protocolMatch = url.match(protocolRegExg);
    if (!protocolMatch) {
        return res.json({
            "error": "invalid URL"
        });
    }
    var hostAndQuery = protocolMatch[1];
    var hostnameMatch = hostAndQuery.match(hostnameRegExp);
    if (hostnameMatch) {
        dns.lookup(hostnameMatch[0], function(err) {
            if (err) {
                res.json({
                    "error": "invalid Hostname"
                });
            } else {
                UrlEntries.findOne({'url': url}, function(err, storedUrl) {
                    if (err) {
                        return;
                    }
                    if (storedUrl) {
                        res.json({"original_url": url, "short_url": storedUrl.index});
                    } else {
                        getCountAndIncrease(req, res, function(cnt) {
                            var newUrlEntry = new UrlEntries({
                                'url': url,
                                'index': cnt,
                            });
                            newUrlEntry.save(function(err) {
                                if (err) return;
                                res.json({
                                    'original_url': url,
                                    'short_url': cnt
                                });
                            });
                        });
                    }
                });
            }
        });
    } else {
        res.json({"error": "invalid URL"});
    }
};

exports.processShortUrl = function (req, res) {
    var shurl = req.params.shurl;
    if (!parseInt(shurl, 10)) {
        res.json({"error": "Wrong Format"});
        return;
    }
    UrlEntries.findOnd({"index": shurl}, function (err, data){
        if (err) return;
        if (data) {
            res.redirect(data.url);
        } else {
            res.json({"error": "No short url found for given input"});
        }
    });
}