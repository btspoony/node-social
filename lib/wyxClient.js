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
		this.user.expire = user.data.expire;
	}
	
	this.source = appinfo.key;
	this.secret = appinfo.secret;
};
util.inherits(wyxClient, ClientBase);

// Set API
wyxClient.prototype.api = require('./apiconfig').WeiyxAPI;

/**
 * Authorization Part
*/
wyxClient.prototype.authorize = function (req, res, callback) {
	var prefix = this.api.NAMESPACE;
	var sessionKey = req.query[prefix+'session_key'],
		signature = req.query[prefix+'signature'];
	
	// if authorized
	if(this.user.userId){
		return callback(null, { platform: this.name, data: this.user })
	}
	
	// if not session key, then return
	if(!sessionKey || !signature){
		return callback("no session key");
	};
	
	// ---- checkSignature --- 
	if(req.query[prefix+'signature'])		delete req.query[prefix+'signature'];
	if(req.query[prefix+'create'])		this.user.create = req.query[prefix+'create'];
	
	var param = {};
	for(key in req.query){
		if(String(key).indexOf(prefix)==0){
			param[key] = req.query[key];
		}
	}
	
	var basestring =this._buildBaseString(param); 
	var hash = this._buildSignature(basestring, this.secret, 'sha1');
	if(hash !== signature){
		callback("signature wrong");
		return;
	}
	
	// ---- check session key ----
	this.user.sessionKey = sessionKey;
	var sessionArr = sessionKey.split('_');
	if(sessionArr.length < 3){
		callback('session key wrong');
		return false;
	}
	this.user.expire = sessionArr[1];
	this.user.userId = sessionArr[2];
	
	// store in the session
	req.session.authorized_user = { platform: this.name, data: this.user };
	
	callback(null, req.session.authorized_user);
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
	return {
		id: data.id,
		name: data.name,
		location:{
			country: "china",
			province: String(data.province),
			city: 		String(data.city),
		},
		imageUrl: data.profile_image_url,
		imageUrl_large: data.avatar_large,
		gender:		data.gender == "m",
		is_special:	Boolean(data.verified),
		specialtype: Number(data.verified_type),
		
		lang: data.lang,
	};
};
