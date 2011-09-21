/**
 * RenRen OAuth2 Lib
 * Based on https://github.com/bang590/node-weibo-oauth
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
	
	// check token
	var	now = new Date();
	if(user){
		this.refresh = user.refresh;
		
		if( !user.expire || user.expire > now){
			this.token = user.token;
			this.expire = user.expire;
			this.secret = appinfo.secret;
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
			var expire_at = new Date();
			expire_at.setTime(expire_at.getTime()+result['expires_in']);
		}
		
		// remove temp
		delete req.session.redirectURI;
		
		// store the access token in the session
		self.token = access_token;
		self.expire = expire_at;
		self.refresh = refresh_token;
		
		req.session.authorized_user = { 
			platform: self.name, 
			token: access_token, 
			refresh: refresh_token, 
			expire: expire_at };
		
		callback.call(context, null, req.session.authorized_user);
	};
	
	// if has token, directly return
	if(this.token){
		return callback.call(context, null, {
				platform: this.name, 
				token: this.token, 
				refresh: this.refresh, 
				expire: this.expire
			});
	}
	
	// if has refresh token
	if(this.refresh){
		this.oa2.refreshAccessToken(this.refresh,{
			grant_type: 'refresh_token',
		}, access_cbfunc );
	}else{ // start new round
		var redirectURI;
		
		// This is get access token round
		if(req.param("code")){
			redirectURI = req.session.redirectURI;
			this.oa2.getOAuthAccessToken(
				req.param("code"),
				{
					redirect_uri: redirectURI,
					grant_type: 'authorization_code',
				}, access_cbfunc);
		}else{ // This is authorize round
			// set redirect_uri
			redirectURI = req.session.redirectURI = "http://"+req.header('Host') + req.url;
			
			var authorizeUrl = this.oa2.getAuthorizeUrl({
					response_type: 'code',
					redirect_uri: redirectURI,
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
		if(err) return callback(err);
		
		if(data){
			data = JSON.parse(data);
		}
		callback(null, data);
	});
};
