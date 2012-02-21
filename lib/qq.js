var util = require('util'),
    crypto = require('crypto'),
    sign = require('./sign'),
    urlparse = require('url').parse,
    querystring = require('querystring'),
    SocialBase = require('./base');

var oauth_site = 'http://113.108.20.23'
  , debug_oauth_site = 'http://119.147.19.43';

var QQ = module.exports = function (appinfo, data, debug) {
  SocialBase.call(this);
  this.platform = 'qq';
  this.appid = appinfo.key;
  this.secret = appinfo.secret;
  this.appinfo = appinfo;
  this.is_debug = debug;
  this.data = data || {};
  this.pf = data.pf || 'qzone';
  this.authorized = !! this.data.sessionKey;

}

util.inherits(QQ, SocialBase);

QQ.prototype.api = require('./apiconfig').QQAPI;

QQ.prototype.get = function(uri, query, callback) {
  return this.request('GET', uri, query, callback);
}

QQ.prototype.post = function(uri, param, callback) {
  return this.request('POST', uri, param, callback);
}

QQ.prototype.request = function(method, uri, params, callback) {
  var src = method.toUpperCase();
  src += '&' + encodeURIComponent(uri);

  params.openid = this.data.snsId;
  params.openkey = this.data.sessionKey;
  params.appid = this.appid;
  params.pf = this.pf;

  var basestring = sign.sortQueryToString(params);
  src += '&' + encodeURIComponent(basestring);

  console.log('request');
  console.log(src);

  var sig = crypto.createHmac('sha1', this.secret + '&').update(src).digest('base64');

  // FIXME post not works, bad request paramters
  // params.sig = sig
  var url = (this.is_debug ? debug_oauth_site : oauth_site) + uri;
  url += '?' + basestring + '&sig=' + encodeURIComponent(sig);

  this._performSecureRequest(method, url, null, null, function(err, data, response) {
      if(err) return callback(err);

      if(data) {
        var obj = JSON.parse(data);
        if(obj.ret == 0) {
          callback(null, obj);
        } else {
          callback(url + ' returns:\n' + data +'\n parms:'+ JSON.stringify(params));
        }
      } else {
        callback(null, data);
      }
  });
}

QQ.getAppEntryInfo = function (req) {
  var openid = req.query['openid'],
      openkey = req.query['openkey'];
  var pf;
  if(req.headers.referer) {
    var refquery = urlparse(req.headers.referer).query;
    pf = querystring.parse(refquery).pf;
  }
  if(openid && openkey) {
    return {
      platform: 'qq',
      snsId : openid,
      added : true,
      sessionKey : openkey,
      pf: pf
    }
  }
}

QQ.prototype.geneCommonUser = function (data) {
  return data;
}

function formatUser (data) {
  data.gender = data.gender == '男';
  data.imageUrl = data.imageUrlMiddle = data.imageUrlLarge = data.figureurl;
  var img = data.figureurl;
  var i = img.lastIndexOf('/');
  // data.imageUrl = img.substring(0, i) + '/30';
  data.imageUrl = data.imageUrlMiddle = img;
  data.imageUrlLarge = img.substring(0, i) + '/100';
  delete data.figureurl;
  delete data.ret;
  delete data.msg;
  delete data.is_lost;
  data.name = data.nickname;
  delete data.nickname;
  return data;
}

// node-social common API
QQ.prototype.account_info = function (param, callback) {
  var self = this;
  this._get_info(function(err, data) {
      if(err) return callback(err);
      data = formatUser(data);
      data.id = self.data.snsId;
      callback(null, data);
  });
}

QQ.prototype.users_info = function (param, callback) {

}

QQ.prototype.friends_ids = function (param, callback) {

}

QQ.prototype.appfriends_ids = function (param, callback) {
  this._get_app_friends(function(err, data){
      if(err) return callback(err);
      var items = data.items.map(function(e) {return e.openid});
      callback(null, items);
  });
}

QQ.prototype.appfriends_info = function (param, callback) {
  var self = this;
  this.appfriends_ids({}, function(err, ids){
      if(err) return callback(err);
      self._get_multi_info(ids, function(err, data) {
          if(err) return callback(err);
          var items = data.items.map(formatUser);
          callback(null, items);
      });
  });
}

QQ.prototype.is_app_user = function (param, callback) {

}

// QQ official api

QQ.FLAG_GENDER = 1;
QQ.FLAG_BLUE_VIP = 2;
QQ.FLAG_NICK_BLUE = 3;
QQ.FLAG_QQSHOW = 4;

QQ.prototype._get_info = function (flag, callback) {
  if(!callback) {
    callback = flag;
    flag = 0;
  }

  this.get('/v3/user/get_info', flag > 0 ? {flag: flag} : {}, callback);
}

QQ.prototype._get_multi_info = function (fopenids, callback) {
  if(!fopenids || fopenids.length == 0) {
    return callback(null, {ret:0, items:[]});
  }
  this.get('/v3/user/get_multi_info', {fopenids: fopenids.join('_')}, callback);
}

QQ.prototype._is_setup = function (callback) {
  this.get('/v3/user/is_setup', {}, callback);
}

QQ.prototype._is_vip = function (callback) {
  this.get('/v3/user/is_vip', {}, callback);
}

QQ.prototype._verify = QQ.prototype.is_login = function (callback) {
  this.get('/v3/user/is_login', {}, callback);
}

QQ.prototype._is_friend = function (fopenid, callback) {
  this.get('/v3/user/is_friend', {fopenid: fopenid}, callback);
}

QQ.prototype._get_app_friends = function (callback) {
  this.get('/v3/relation/get_app_friends', {}, callback);
}

QQ.prototype._buy_goods = function () {
  throw new Error('not implemented');
}
