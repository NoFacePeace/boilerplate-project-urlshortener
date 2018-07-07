'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var dns = require('dns');
require('dotenv').config();

var cors = require('cors');

var app = express();
var count = 0;

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI, {
  useMongoClient: true,
});
var urlSchema = mongoose.Schema({
  origianl_url: String,
  short_url: Number,
});
var URL = mongoose.model('URL', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', function(req, res) {
  var host = req.body.url;
  console.log(host);
  var pattern = /^http[s]?:\/\/[a-z0-9]+\.([a-z0-9]+|[a-z0-9]+\.[a-z]{2,})(\/[a-z0-9]+)*$/i;
  var error = {
    error: 'invalid URL',
  };
  if (!pattern.test(host)) {
    return res.json(error);
  }
  pattern = /[0-9a-z]+\.([0-9a-z]+\.[0-9a-z]{2,}|[0-9a-z]+)/gi;
  host = host.match(pattern)[0];
  dns.lookup(host, function(err, address) {
    if (err) {
      return res.json(error);
    }
    var url = new URL({origianl_url: host, short_url: count++});
    url.save().then(function(data) {
      return res.json({
        origianl_url: data.origianl_url,
        short_url: data.short_url,
      });
    });
  }); 
});

app.get('/api/shorturl/:num', function(req, res) {
  var short_url = parseInt(req.params.num);
  URL.findOne({short_url: short_url}, function(err, data) {
    if (err) {
      return res.status(404).type('text').send('Not Found');
    }
    res.redirect('http://' + data.origianl_url);
  });
});

app.use(function(req, res, next) {
  res.status(404).type('text').send('Not Found');
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});