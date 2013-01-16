var util = require('util'),
    crypto = require('crypto'),
    sign = require('./sign'),
    urlparse = require('url').parse,
    querystring = require('querystring'),
    SocialBase = require('./base');

var oauth_site = 'http://openapi.tencentyun.com'
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
  params.format = "json";

  if( params.sig ) delete params.sig;

  var basestring = sign.sortQueryToString(params);
  src += '&' + encodeURIComponent(basestring);
  var sig = crypto.createHmac('sha1', this.secret + '&').update(src).digest('base64');
  params.sig = sig;
  var url = (this.is_debug ? debug_oauth_site : oauth_site) + uri;
  this._performSecureRequest(method, url, params, null, function(err, data, response) {
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
  var query = req.query;
  var openid = query['openid'],
      openkey = query['openkey'];

  if(openid && openkey) {
    var info = {};
    for( var key in query ){
      info[key] = query[key];
    }
    info.platform = 'qq';
    info.snsId = openid;
    info.added = true;
    info.sessionKey = openkey;
    return info;
  }
}

QQ.prototype.geneCommonUser = function (data) {
  // remove common platform data
  delete data.ret;
  delete data.msg;
  delete data.is_lost;

  if( !data.items ){
    data.id = this.data.snsId;
    return _formatUser( data );
  }else{ 
    var items = data.items.map( _formatUser );
    return items;
  }
}

function _formatUser( data ){
  if( data.openid != undefined ){
    data.id = data.openid;
    delete data.openid;
  }

  data.gender = data.gender == '男';

  if( data.figureurl != undefined ){
    data.imageUrl = data.imageUrlMiddle = data.imageUrlLarge = data.figureurl;
    var img = data.figureurl;
    var i = img.lastIndexOf('/');
    // data.imageUrl = img.substring(0, i) + '/30';
    data.imageUrl = data.imageUrlMiddle = img;
    data.imageUrlLarge = img.substring(0, i) + '/100';
    delete data.figureurl;
  }

  if( data.nickname != undefined ){
    data.name = data.nickname;
    delete data.nickname; 
  }

  if( data.is_yellow_vip != undefined ){
    data.isSpecial = data.is_yellow_vip;
    delete data.is_yellow_vip;
  }
  
  if( data.yellow_vip_level != undefined ){
    data.specialType = Number(data.yellow_vip_level);
    delete data.yellow_vip_level;
  }

  return data;
}

// node-social common API
QQ.prototype.account_info = function (param, callback) {
  param = param || {};
  param["flag"] = 0;
  SocialBase.prototype.account_info.call(this, param, callback );
};

QQ.prototype.users_info = function( param, callback ) {
  if( !param["fopenids"] ) return callback( null, [] );

  SocialBase.prototype.users_info.call( this, param, callback );
};

// lack of appfriends info api, use two step to get all friends info
QQ.prototype.appfriends_info = function(param, callback) {
  param = param || {};
  var self = this;
  SocialBase.prototype.appfriends_ids.call(this, param, function(err, data){
    if(err) return callback(err);
    var items = data.items.map(function(e) {return e.openid});
    param['fopenids'] = items.join("_");
    self.users_info(param, callback);
  });
};

QQ.prototype.friends_ids = function(param, callback) {
  this.appfriends_ids(param, callback);
};

QQ.prototype.appfriends_ids = function (param, callback) {
  SocialBase.prototype.appfriends_ids.call(this, param, function(err, data){
    if(err) return callback(err);

    var items = data.items.map(function(e) {return e.openid});
    callback(null, items);
  });
}