
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// social factory
var factory = require('../')({
  qq: { key: 1234567, secret: "12345f9a47df4d1eaeb3bad9a7e54321" } // test secret for payment testing
});

// the test router
app.get('/cgi-bin/temp.py', function(req, res){
  var client = factory.createClient( "qq" );
  client.payment_callback(req, res
    , function onSuccess(callback) {
      callback();
      console.log( "onSuccess!" );
    }
    , function onFail(callback) {
      callback();
      console.log( "onFail!" );
    });
  res.send("OK");
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// send request
var request = require("request");
var host = "http://localhost:"+ app.get('port');
// This test is based on http://wiki.open.qq.com/wiki/%E5%9B%9E%E8%B0%83%E5%8F%91%E8%B4%A7URL%E7%9A%84%E5%8D%8F%E8%AE%AE%E8%AF%B4%E6%98%8E_V3
request.get( host + "/cgi-bin/temp.py?openid=test001&appid=33758&ts=1328855301&payitem=323003*8*1&token=53227955F80B805B50FFB511E5AD51E025360&billno=-APPDJT18700-20120210-1428215572&version=v3&zoneid=1&providetype=0&amt=80&payamt_coins=20&pubacct_payamt_coins=10&sig=VvKwcaMqUNpKhx0XfCvOqPRiAnU%3D");
request.get( host + "/cgi-bin/temp.py?openid=test002&appid=33758&ts=1328855301&payitem=323003*8*1&token=53227955F80B805B50FFB511E5AD51E025360&billno=-APPDJT18700-20120210-1428215572&version=v3&zoneid=1&providetype=0&amt=80&payamt_coins=20&pubacct_payamt_coins=10&sig=VvKwcaMqUNpKhx0XfCvOqPRiAnU%3D");