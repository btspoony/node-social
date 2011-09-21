* /**
 * RenRen OAuth2 Lib
 * Based on https://github.com/bang590/node-weibo-oauth
 * @author Tang Bo Hao
 */

// Local Require
var util = require('util'),
	OAuth2 = require('oauth').OAuth2,
	ClientBase = require('./clientBase'),
	querystring = require('querystring');

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
 * @param {String} next_url set a next to url(can skip)
 * @param {Function} callback Callback Function
 * @param {Object} context 'this' object of callback
 */
renrenClient.prototype.authorize = function (req, res, next_url, callback, context) {
	// check if ignore next_url
	if(next_url && typeof next_url !=="string"){
		context = callback;
		callback = next_url;
	}
	
	// set access token callback
	var access_cbfunc = function(error, access_token, refresh_token, result) {
		//Finally call back
		if (error) return callback.call(context, error);
		
		// set expire date
		if(result['expires_in']){
			var expire_at = new Date();
			expire_at.setTime(expire_at.getTime()+result['expires_in']);
		}
		// store the access token in the session
		this.token = access_token;
		this.expire = user.expire;
		
		req.session.authorized_user = { 
			platform: this.name, 
			token:access_token, 
			refresh:refresh_token, 
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
		// set callback url
		var callback_url = "http://"+req.header('Host') + req.url;
		// check next url to set callback url
		callback_url += (next_url && next_url != "") ? "?next="+querystring.escape(next_url) : "";
	
		// This is get access token round
		if(req.param("code")){
			this.oa2.getOAuthAccessToken(
				req.param("code"),
				{
					redirect_uri: callback_url,
					grant_type: 'authorization_code',
				}, access_cbfunc);
		}else{ // This is authorize round
			var authorizeUrl = this.oa2.getAuthorizeUrl({
					response_type: 'code',
					redirect_uri: callback_url,
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
	param.sig = this._buildSignature(this._buildBaseString(param, true, true), this.secret);
	
	// build post data
	for(var key in param){
		param[key] = this._encodeData(param[key].toString());
	}
	
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
