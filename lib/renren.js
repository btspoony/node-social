/**
 * RenRen OAuth2 Lib
 * @author Tang Bo Hao
 */

// Local Require
var util = require('util'),
    OAuth2 = require('oauth').OAuth2,
    SocialBase = require('./base'),
    sign = require('./sign'),
    URL= require('url');

// Basic Info
var apiurl = 'http://api.renren.com/restserver.do'
  , result_format = 'JSON';

// export Renren
var Renren = module.exports = function Renren(appinfo, data) {
  SocialBase.call(this);
  this.appinfo = appinfo;
  this.platform = 'renren';
  this.secret = appinfo.secret;
  this.data = data || {};

  // Create OAuth2 Object based on config
  this.oa2 = new OAuth2(
    appinfo.key, appinfo.secret,
    this.api.oauth_site, this.api.oauth_authorize, this.api.oauth_token /* oauth urls */
  );
};
util.inherits(Renren, SocialBase);

// Set API
Renren.prototype.api = require('./apiconfig').RenRenAPI;

Renren.checkSignature = function(queryObj, secret){
  var query = sign.removeField(queryObj, 'origin', 'xn_sig');
  query = sign.removePrefix(query, 'xn_sig_');

  // join querystring without sep '&', and not call encodeURI
  var baseStr = sign.sortQueryToString(query, '', false);
  var sig = sign.buildSign(baseStr, secret , 'md5');

  return sig === queryObj['xn_sig'];
}

Renren.getAppEntryInfo = function (req, secret) {
  if(req.query['xn_sig'] && Renren.checkSignature(req.query, secret)) {
    var query = req.query;
    var info = {};
    for( var key in query ){
      info[key] = query[key];
    }
    info.platform = 'renren';
    info.added = req.query['xn_sig_added'] == 1;
    info.snsId = req.query['xn_sig_user'];
    return info;
  }
}

/**
 * Authorization Part
 * @param {Request} req express request object
 * @param {Response} res express response object
 * @param {Function} callback Callback Function
 */
Renren.prototype.getOAuthAccessToken = function (code, redirectURI, callback) {
  var self = this,
      data = this.data;

  // set access token callback
  var access_cbfunc = function(error, access_token, refresh_token, result) {
    //Finally call back
    if (error) return callback(new Error(JSON.stringify(error)));

    // set expire date
    if(result['expires_in']){
      var expire_at = Date.now() + result['expires_in']*1000 ;
    }

    // store the access token in the data
    data.token = access_token;
    data.refresh = refresh_token;
    data.expire = expire_at;

    callback(null, data);
  };

  // if has refresh token
  if( data.refresh ){
    this.oa2.getOAuthAccessToken( data.refresh, {
        grant_type: 'refresh_token'
    }, access_cbfunc );
  }else{ // start new round
    this.oa2.getOAuthAccessToken(code,{
        grant_type: 'authorization_code'
      , redirect_uri : redirectURI
    }, access_cbfunc);
  }// end refresh if
};

Renren.prototype.getAuthorizeUrl = function (redirectURI) {
  return this.oa2.getAuthorizeUrl({
      response_type : 'code',
      redirect_uri : redirectURI
  });
}

/* ==!====== API Method =========
 ================================== */
/**
 * Get Method
 * @param api API Target
 * @param param parameters
 * @param callback Template: function( err, data, response )
 */
Renren.prototype.get = function(api, param, callback) {
  this.post(api, param, callback);
};

/**
 * Restful Post/Put Method
 * @param api API Target
 * @param body HTTP request content
 * @param callback Template: function( err, data, response )
 */
Renren.prototype.post = function post(api, body, callback) {
  if (!this.data.token) return callback(new Error("not authorized"));

  var param = {
    method: api,
    format: result_format,
    v: '1.0',
    access_token: this.data.token
  };
  // set body in param
  for(var key in body){
    param[key] = body[key];
  }
  // set sig
  // join querystring without sep '&', and not call encodeURI
  var basestring = sign.sortQueryToString(param, '', false);
  param.sig = sign.buildSign(basestring, this.secret, 'md5');
  // do post
  this._performSecureRequest('POST', apiurl, param, null
    , function(err, data){
      if(err) return callback(err);

      if(data){
        data = JSON.parse(data);
      }
      callback(null, data);
  });
};

Renren.prototype.geneCommonUser = function (data) {
  if(!data.uid) return data;

  //organize data with common structure
  data.id = data.uid;
  delete data.uid;
  if(data.hometown_location) {
    var location = data.hometown_location;
    data.country = location.country;
    data.province = location.province;
    data.city = location.city;
    delete data.hometown_location;
    data.lang = 'zh-cn';
  }
  if(data.tinyurl) {
    data.imageUrl = data.tinyurl;
    delete data.tinyurl;
  }
  if(data.headurl) {
    data.imageUrlMiddle = data.headurl;
    delete data.headurl;
  }
  if(data.mainurl) {
    data.imageUrlLarge = data.mainurl;
    delete data.mainurl;
  }
  if(data.sex !== undefined) {
    data.gender = data.sex == 1;
    delete data.sex;
  }
  if(data.zidou !== undefined) {
    data.isSpecial = Boolean(data.zidou == 1);
    delete data.zidou;
  }
  if(data.vip !== undefined) {
    data.specialType = Number(data.vip);
    delete data.vip;
  }

  return data;

};

// override common api
Renren.prototype.account_info = function (param, callback) {
  param = param || {};
  param.fields = param.fields || "uid,name,sex,star,zidou,vip,tinyurl,mainurl,hometown_location";
  var single = typeof param.uids === 'undefined';

  SocialBase.prototype.account_info.call(this, param, function(err, data){
      if(data && single) data = data[0];
      callback(err, data);
  });
};

Renren.prototype.appfriends_info = function(param, callback) {
  param = param || {};
  param.fields = param.fields || 'uid,name,tinyurl,headurl';
  SocialBase.prototype.appfriends_info.call(this, param, callback);
}
