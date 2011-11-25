/**
 * Sina WeiYouXI in-frame Client Lib
 * @author Tang Bo Hao
 */

// Local Require
var util = require('util'),
    ClientBase = require('./clientBase');

// export wyxClient
var wyxClient = module.exports = function wyxClient(appinfo, user) {
  ClientBase.call(this);
  this.name = 'wyx';
  this.user = {};

  if(user && user.data && user.data.sessionKey){
    this.user.sessionKey = user.data.sessionKey;
    this.user.userId = user.data.userId;
    this.user.create = user.data.create;
    this.expire = user.expire;
  }

  this.source = appinfo.key;
  this.secret = appinfo.secret;
};
util.inherits(wyxClient, ClientBase);

// Set API
wyxClient.prototype.api = require('./apiconfig').WeiyxAPI;

wyxClient.prototype.checkSignature = function(queryObj, secret) {
  var prefix = this.api.NAMESPACE;
  var baseStr = this._buildBaseString(queryObj, true, true, prefix);
  var sig = this._buildSignature(baseStr, secret || this.secret, 'sha1');
  return sig === queryObj[prefix + 'signature'];
}

/**
 * Authorization Part
 */
wyxClient.prototype.authorize = function (req, res, callback, context) {
  var prefix = this.api.NAMESPACE;
  var sessionKey = req.query[prefix+'session_key'],
      signature = req.query[prefix+'signature'];

  // if authorized
  if(this.user.userId){
    return callback.call(context, null, { platform: this.name, data: this.user, expire: this.expire });
  }

  // if not session key, then return
  if(!sessionKey || !signature){
    return callback.call(context, "no session key");
  };

  // ---- checkSignature --- 
  if(req.query[prefix+'signature'])    delete req.query[prefix+'signature'];
  if(req.query[prefix+'create'])    this.user.create = req.query[prefix+'create'];

  var param = {};
  for(key in req.query){
    if(String(key).indexOf(prefix)==0){
      param[key] = req.query[key];
    }
  }

  var basestring =this._buildBaseString(param); 
  var hash = this._buildSignature(basestring, this.secret, 'sha1');
  if(hash !== signature){
    callback.call(context, "signature wrong");
    return;
  }

  // ---- check session key ----
  this.user.sessionKey = sessionKey;
  var sessionArr = sessionKey.split('_');
  if(sessionArr.length < 3){
    callback.call(context, 'session key wrong');
    return false;
  }
  this.expire = Number(sessionArr[1]) * 1000;
  this.user.userId = sessionArr[2];

  var user = { platform: this.name, data: this.user, expire: this.expire };

  callback.call(context, null, user);
};

/**
 * build query string
 * @param {Object}
 */
wyxClient.prototype.buildParamObject = function buildParamObject(paramObj) {
  var timestamp = (new Date()).getTime();
  paramObj.source = this.source;
  paramObj.timestamp = timestamp.toString();
  paramObj.session_key = this.user.sessionKey;

  var basestring = this._buildBaseString(paramObj);
  return basestring;
};

/* ==!====== Restful Method =========
 Get, Post, Delete
 ================================== */
/**
 * Restful Get Method
 * @param api API Target
 * @param param parameters
 * @param callback Template: function( err, data, response )
 */
wyxClient.prototype.get = function(api, param, callback, context) {
  if (!this.user.userId ) return callback.call(context, "not authorize");

  // start build params
  var basestring = this.buildParamObject(param || {}),
      signature = this._buildSignature(basestring, this.secret);
  basestring += "&signature=" + signature;

  // do get
  var url = this.api.apiurl + api + '.json?' + basestring;
  this._performSecureRequest('GET', url, null, null
    , function(err, data){
      if(err) return callback.call(context, err);

      if(data){
        data = JSON.parse(data);
      }
      callback.call(context, null, data);
  });
};

/**
 * Restful Post Method
 * @param api API Target
 * @param param parameters
 * @param callback Template: function( err, data, response )
 */
wyxClient.prototype.post = function(api, param, callback, context) {
  if (!this.user.userId ) return callback.call(context, "not authorize");

  // start build params
  var basestring = this.buildParamObject(param || {});
  param.signature = this._buildSignature(basestring, this.secret);

  // build post data
  for(var key in param){
    param[key] = this._encodeData(param[key].toString());
  }

  // do post
  var url = this.api.apiurl + api + '.json';
  this._performSecureRequest('POST', url, param, null
    , function(err, data){
      if(err) return callback.call(context, err);

      if(data){
        data = JSON.parse(data);
      }
      callback.call(context, null, data);
  });
};

wyxClient.prototype.geneCommonUser = function (data) {
  if( !data.id ) return data;

  //organize data with common structure
  if(data.profile_image_url){
    data.imageUrl = data.profile_image_url;
    delete data.profile_image_url;
  }

  if(data.avatar_large) {
    data.imageUrlLarge = data.avatar_large;
    delete data.avatar_large;
  }

  if(data.gender !== undefined){
    data.gender = data.gender == 'm'
  }

  if(data.verified !== undefined) {
    data.isSpecial = Boolean(data.verified);
    delete data.verified;
  }

  if(data.verified_type !== undefined) {
    data.specialType = Number(data.verified_type);
    delete data.verified_type;
  }

  if(data.province || data.city) {
    data.country: "china"
    data.province: data.province || ''
    data.city: data.city || ''
  }

  return data;
};
