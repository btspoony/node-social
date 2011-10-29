/**
 * OAuth Manager Factory
 * @author Tang Bo Hao
 */

var defaultAppinfo = null;

var factory = module.exports = {};
/**
 * Set default app info (type, key, secret) for common usage
 */
factory.setDefaultAppinfo = function setDefaultAppinfo(info){
	if(!info.type || !info.key || !info.secret) return;
	
	defaultAppinfo = {};
	for(var key in info){
		defaultAppinfo[key] = info[key];
	}
}
factory.getDefaultAppinfo = function getDefaultAppinfo () {
	return defaultAppinfo;
}

/**
 * create a client by type
 * @param {Object} appinfo a object contain key and secret, null is using default
 * @param {Object} user authorized_data in session
 */
factory.createClient = function createClient(appinfo, user) {
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