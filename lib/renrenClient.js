/**
 * RenRen OAuth2 Lib
 * @author Tang Bo Hao
 */

// Local Require
var util = require('util'),
    OAuth2 = require('../support/oauth').OAuth2,
    ClientBase = require('./clientBase'),
    URL= require('url');

// export renrenClient
var renrenClient = module.exports = function renrenClient(appinfo, user) {
  ClientBase.call(this);
  this.name = 'renren';
  this.secret = appinfo.secret;

  // check token
  var	now = new Date();
  if(user){
    this.refresh = user.refresh;

    if( !user.expire || user.expire > now){
      this.token = user.token;
      this.expire = user.expire;
      return;
    }
  }
  // Create OAuth2 Object based on config
  this.oa2 = new OAuth2(
    appinfo.key, appinfo.secret,
    this.api.oauth_site, this.api.oauth_authorize, this.api.oauth_token /* oauth urls */
  );

};
util.inherits(renrenClient, ClientBase);

// Set API
renrenClient.prototype.api = require('./apiconfig').RenRenAPI;

renrenClient.prototype.checkSignature = function(queryObj, secret){
  var baseStr = this._buildBaseString(queryObj, true, true, 'xn_sig_');
  var sig = this._buildSignature(baseStr, secret || this.secret, 'md5');
  return sig === queryObj['xn_sig'];
}

/**
 * Authorization Part
 * @param {Request} req express request object
 * @param {Response} res express response object
 * @param {Function} callback Callback Function
 * @param {Object} context 'this' object of callback
 */
renrenClient.prototype.authorize = function (req, res, callback, context) {
  var self = this;
  // set access token callback
  var access_cbfunc = function(error, access_token, refresh_token, result) {
    //Finally call back
    if (error) return callback.call(context, error);

    // set expire date
    if(result['expires_in']){
      var expire_at = Date.now() + result['expires_in']*1000 ;
      var r_expire_at = Date.now() + result['expires_in']*1000*2 ;
    }

    // remove temp
    req.session.redirectURI && delete req.session.redirectURI;

    // store the access token in the session
    self.token = access_token;
    self.expire = expire_at;
    self.refresh = refresh_token;

    var user = { 
      platform: self.name, 
      token: access_token, 
      refresh: refresh_token, 
      expire: expire_at, 
      r_expire: r_expire_at
    };

    callback.call(context, null, user);
  };

  // if has token, directly return
  if(this.token){
    return callback.call(context, null, {
        platform: this.name, 
        token: this.token, 
        refresh: this.refresh, 
        expire: this.expire, 
        r_expire: this.r_expire
    });
  }

  // if has refresh token
  if(this.refresh && this.r_expire && Date.now() < this.r_expire){
    this.oa2.refreshAccessToken(this.refresh,{
        grant_type: 'refresh_token'
    }, access_cbfunc );
  }else{ // start new round
    var redirectURI;

    // This is get access token round
    if(req.param("code")){
      if(req.session.redirectURI){
        redirectURI = req.session.redirectURI;
      }else{
        var i = req.url.indexOf("?");
        redirectURI = "http://"+req.header('Host') + (i>=0 ? req.url.substring(0,i) : req.url);
      }
      this.oa2.getOAuthAccessToken(
        req.param("code"),
        {
          redirect_uri: redirectURI,
          grant_type: 'authorization_code'
      }, access_cbfunc);
    }else{ // This is authorize round
      // set redirect_uri
      redirectURI = req.session.redirectURI = "http://"+req.header('Host') + req.url;

      var authorizeUrl = this.oa2.getAuthorizeUrl({
          response_type: 'code',
          redirect_uri: redirectURI
      });

      res.redirect(authorizeUrl);
    }
  }// end refresh if
};

/* ==!====== API Method =========
 ================================== */
/**
 * Get Method
 * @param api API Target
 * @param param parameters
 * @param callback Template: function( err, data, response )
 */
renrenClient.prototype.get = function(api, param, callback, context) {
  if (!this.token) return callback.call(context, "not authorized");
  this.post(api, param, callback, context);
};

/**
 * Restful Post/Put Method
 * @param api API Target
 * @param body HTTP request content
 * @param callback Template: function( err, data, response )
 * @param {Object} context 'this' object of callback
 */
renrenClient.prototype.post = function post(api, body, callback, context) {
  if (!this.token) return callback.call(context, "not authorized");

  var param = {
    method: api,
    format: this.api.result_format,
    v: '1.0',
    access_token: this.token
  };
  // set body in param
  for(var key in body){
    param[key] = body[key];
  }
  // set sig
  var basestring = this._buildBaseString(param, true, true);
  param.sig = this._buildSignature(basestring, this.secret, 'md5');
  // do post
  this._performSecureRequest('POST', this.api.apiurl, param, null
    , function(err, data){
      if(err) return callback.call(context, err);

      if(data){
        data = JSON.parse(data);
      }
      callback.call(context, null, data);
  });
};

renrenClient.prototype.geneCommonUser = function (data) {
  if(!data.uid) return data;

  //organize data with common structure
  data.id = data.uid;
  delete data.uid;
  if(data.hometown_location) {
    data.location = data.hometown_location;
    delete data.hometown_location;
    data.lang = 'zh-cn';
  }
  if(data.tinyurl) {
    data.imageUrl = data.tinyurl;
    delete data.tinyurl;
  }
  if(data.mainurl) {
    data.imageUrl_large = data.mainurl;
    delete data.mainurl;
  }
  if(data.sex !== undefined) {
    data.gender = data.sex == 1;
    delete data.sex;
  }
  if(data.zidou !== undefined) {
    data.is_special = Boolean(data.zidou == 1);
    delete data.zidou;
  }
  if(data.vip !== undefined) {
    data.specialtype = Number(data.vip);
    delete data.vip;
  }

  return data;

};

// override common api
renrenClient.prototype.account_info = function (param, callback, context) {
  param = param || {};
  param.fields = param.fields || "uid,name,sex,star,zidou,vip,tinyurl,mainurl,hometown_location";
  var single = typeof param.uids === 'undefined';

  ClientBase.prototype.account_info.call(this, param, function(err, data){
      if(data && single) data = data[0];
      callback.call(context, err, data);
  }, this);
};

renrenClient.prototype.appfriends_info = function(param, callback, context) {
  param = param || {};
  param.fields = param.fields || 'uid,name,tinyurl';
  ClientBase.prototype.appfriends_info.call(this, param, function(err, data){
      callback.call(context, err, data);
  }, this);
}
