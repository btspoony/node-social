/**
 * Sina WeiYouXI in-frame Client Lib
 * @author Tang Bo Hao
 */

// Local Require
var util = require('util'),
    sign = require('./sign'),
    ClientBase = require('./clientBase');

// export WYXClient
var WYXClient = module.exports = function WYXClient(appinfo, data) {
  ClientBase.call(this);
  this.platform = 'wyx';
  this.data = data || {};


  this.appkey = appinfo.key;
  this.secret = appinfo.secret;
};
util.inherits(WYXClient, ClientBase);

// Set API
WYXClient.prototype.api = require('./apiconfig').WeiyxAPI;

WYXClient.checkSignature = function(queryObj, secret) {
  var query = sign.removeField(queryObj, 'wyx_signature');
  var baseStr = sign.sortQueryToString(query/* '&', false */ );
  var sig = sign.buildSign(baseStr, secret, 'sha1');
  return sig === queryObj['wyx_signature'];
}

WYXClient.getAppEntryInfo = function(req, secret) {
  if(req.query['wyx_signature'] && WYXClient.checkSignature(req.query, secret)) {

      return {
        platform : 'wyx',
        added : true,
        create : req.query['wyx_create'], // ???
        snsId : req.query['wyx_user_id'],
        sessionKey: req.query['wyx_session_key'],
        authorized: !!req.query['wyx_session_key'],
        expire : req.query['wyx_expire']
      };

  }
}

/**
 * Authorization Part
 */
WYXClient.prototype.getOAuthAccessToken = function (req, res, callback) {
  return callback(new Error('no such method'));
};

/**
 * build query string
 * @param {Object}
 */
WYXClient.prototype.buildParamObject = function buildParamObject(paramObj) {
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
WYXClient.prototype.get = function(api, param, callback) {
  if (!this.data.snsId ) return callback(new Error("not authorize"));

  // start build params
  var basestring = this.buildParamObject(param || {}),
      signature = sign.buildSign(basestring, this.secret);
  basestring += "&signature=" + signature;

  // do get
  var url = this.api.apiurl + api + '.json?' + basestring;
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
WYXClient.prototype.post = function(api, param, callback) {
  if (!this.data.snsId ) return callback(new Error("not authorize"));

  // start build params
  var basestring = this.buildParamObject(param || {});
  param.signature = sign.buildSign(basestring, this.secret);
  // build post data
  for(var key in param){
    param[key] = sign.encodeData(param[key].toString());
  }

  // do post
  var url = this.api.apiurl + api + '.json';
  this._performSecureRequest('POST', url, param, null
    , function(err, data){
      if(err) return callback(err);

      if(data){
        data = JSON.parse(data);
      }
      callback(null, data);
  });
};

WYXClient.prototype.geneCommonUser = function (data) {
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

WYXClient.prototype.appfriends_info = function (param, callback) {
  param = param || {};
  var self = this;
  ClientBase.prototype.appfriends_info.call(this, param, function(err, data){
      if(err) return callback(err);
      var friends = [];
      for(var id in data) {
        friends.push(self.geneCommonUser(data[id]));
      }
      callback(err, friends);
  });
}
