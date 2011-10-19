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
	if(!info.type || !info.key || !info.secret) return;
	
	defaultAppinfo = {};
	for(var key in info){
		defaultAppinfo[key] = info[key];
	}
}

/**
 * get basic info from iframe query
 */
exports.getInfoFromQuery = function getInfoFromQuery(reqQuery){
	if(typeof reqQuery === "string"){
		reqQuery = querystring.parse(reqQuery);
	}
	
	var ret = {}, tmp;
	for(var key in reqQuery){
		tmp = decodeURI(key);
		if(tmp.indexOf("xn_sig_")>=0){ // for renren iframe
			ret.type = 'renren';
			if(reqQuery['xn_sig_user']) ret.userid = ret.type+'.'+reqQuery['xn_sig_user'];
			ret.added = Boolean(reqQuery['xn_sig_added'] == 1);
			break;
		}
		if(tmp.indexOf("wyx_")>=0){ // for wyx iframe
			ret.type = 'wyx';
			ret.userid = ret.type+'.'+reqQuery['wyx_user_id'];
			ret.added = true;
			break;
		}
	}
	return ret;
}

/**
 * create a client by type
 * @param {String} type SNS platform type
 * @param {Object} appinfo a object contain key and secret, null is using default
 * @param {Object} user authorized_user in session
 */
exports.createClient = function createClient(appinfo, user) {
	// no appinfo, using default
	if(!appinfo || ( !appinfo.type || !appinfo.key || !appinfo.secret)){
		if(!defaultAppinfo) return null;
		user = appinfo;
		appinfo = defaultAppinfo;
	}
	
	var client;
	switch(appinfo.type){
	case 'wyx': 
		client = require('./wyxClient');
  	break;
	case 'renren':
		client = require('./renrenClient');
  	break;
	case 'sina':
	default:
		client = require('./sinaClient');
  	break;
	}
	
	var ret = new client(appinfo, user);
	return ret;
}