/**
 * Sina WeiYouXI in-frame Client Lib
 * @author Tang Bo Hao
 */

// Local Require
var util = require('util'),
    sign = require('./sign'),
    SocialBase = require('./base');
// Basic Info
var apiurl = 'http://api.weibo.com/game/1/'
  , result_format = '.json';

// export WYX
var WYX = module.exports = function WYX(appinfo, data) {
  SocialBase.call(this);
  this.platform = 'wyx';
  this.data = data || {};

  this.appkey = appinfo.key;
  this.secret = appinfo.secret;
  this.appinfo = appinfo;
};
util.inherits(WYX, SocialBase);

// Set API
WYX.prototype.api = require('./apiconfig').WeiyxAPI;

WYX.checkSignature = function(queryObj, secret) {
  var query = {}
  for(var key in queryObj) {
    if(key.indexOf('wyx_') == 0 && key != 'wyx_signature') {
      query[key] = queryObj[key];
    }
  }
  var baseStr = sign.sortQueryToString(query/* '&', false */ );
  var sig = sign.buildSign(baseStr, secret, 'sha1');
  return sig === queryObj['wyx_signature'];
}

WYX.getAppEntryInfo = function(req, secret) {
  if(req.query['wyx_signature'] && WYX.checkSignature(req.query, secret)) {
    var query = req.query;
    var info = {};
    for( var key in query ){
      info[key] = query[key];
    }
    info.platform = 'wyx';
    info.added = true;
    info.snsId = req.query['wyx_user_id'];
    info.sessionKey = req.query['wyx_session_key'];
    info.expire = req.query['wyx_expire'];
    return info;
  }
}

/**
 * Authorization Part
 */
WYX.prototype.getOAuthAccessToken = function (req, res, callback) {
  return callback(new Error('no such method'));
};

/**
 * build query string
 * @param {Object}
 */
WYX.prototype.buildParamObject = function buildParamObject(paramObj) {
  var timestamp = (new Date()).getTime();
  paramObj.source = this.appkey;
  paramObj.timestamp = timestamp.toString();
  paramObj.session_key = this.data.sessionKey;

  var basestring = sign.sortQueryToString(paramObj);
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
WYX.prototype.get = function(api, param, callback) {
  if (!this.data.snsId ) return callback(new Error("not authorize"));

  // start build params
  var basestring = this.buildParamObject(param || {}),
      signature = sign.buildSign(basestring, this.secret);
  basestring += "&signature=" + signature;

  // do get
  var url = apiurl + api + '.json?' + basestring;
  this._performSecureRequest('GET', url, null, null
    , function(err, data){
      if(err) return callback(err);

      if(data){
        data = JSON.parse(data);
      }
      callback(null, data);
  });
};

/**
 * Restful Post Method
 * @param api API Target
 * @param param parameters
 * @param callback Template: function( err, data, response )
 */
WYX.prototype.post = function(api, param, callback) {
  if (!this.data.snsId ) return callback(new Error("not authorize"));

  // start build params
  var basestring = this.buildParamObject(param || {});
  param.signature = sign.buildSign(basestring, this.secret);
  // build post data
  for(var key in param){
    param[key] = sign.encodeData(param[key].toString());
  }

  // do post
  var url = apiurl + api + '.json';
  this._performSecureRequest('POST', url, param, null
    , function(err, data){
      if(err) return callback(err);

      if(data){
        data = JSON.parse(data);
      }
      callback(null, data);
  });
};

WYX.prototype.geneCommonUser = function (data) {
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
    data.country = "china"
    data.province = data.province || ''
    data.city = data.city || ''
  }

  return data;
};

WYX.prototype.appfriends_info = function (param, callback) {
  param = param || {};
  var self = this;
  SocialBase.prototype.appfriends_info.call(this, param, function(err, data){
      if(err) return callback(err);
      var friends = [];
      for(var id in data) {
        friends.push(self.geneCommonUser(data[id]));
      }
      callback(err, friends);
  });
}
