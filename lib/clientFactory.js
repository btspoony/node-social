/**
 * OAuth Manager Factory
 * @author Tang Bo Hao
 */

//Dependence
var querystring = require('querystring');

var defaultAppinfo = null;
/**
 * Set default app info (key, secret) for common usage
 */
exports.setDefaultAppinfo = function setDefaultAppinfo(info){
	if(!info.key || !info.secret) return;
	
	defaultAppinfo = {};
	for(var key in info){
		defaultAppinfo[key] = info[key];
	}
}

exports.getTypeByQuery = function getTypeByQuery(reqQuery){
	if(typeof reqQuery === "string"){
		reqQuery = querystring.parse(reqQuery);
	}
	
	var ret, tmp;
	for(var key in reqQuery){
		tmp = decodeURI(key);
		if(tmp.indexOf("xn_sig_")>=0){ // for renren iframe
			return 'renren';
		}
		if(tmp.indexOf("wyx_")>=0){ // for wyx iframe
			return 'wyx';
		}
	}
	return "";
}

/**
 * create a client by type
 * @param {String} type SNS platform type
 * @param {Object} appinfo a object contain key and secret, null is using default
 * @param {Object} user authorized_user in session
 */
exports.createClient = function createClient(type, appinfo, user) {
	// no appinfo, using default
	if(!appinfo || (!appinfo.key || !appinfo.secret)){
		if(!defaultAppinfo) return null;
		user = appinfo;
		appinfo = defaultAppinfo;
	}
	
	var client;
	switch(type){
	case 'wyx': 
		auth = require('./wyxAuth');
  	break;
	case 'renren':
		auth = require('./renrenOAuth');
  	break;
	case 'sina':
	default:
		auth = require('./sinaOAuth');
  	break;
	}
	var ret = new client(appinfo, user);
	return ret;
}