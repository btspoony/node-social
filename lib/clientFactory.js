/**
 * OAuth Manager Factory
 * @author Tang Bo Hao
 */

var defaultAppinfo = null;

/**
 * configure snsclient
 *
 * @param platforms
 *    {platform_name : {key: key, secret: secret}}
 *
 *  you can set multi platforms
 *
 *  usage:
 *
 *  var factory = require('snsclient')({
 *    renren: {
 *        key : '.....'
 *        , secret : '.....'
 *    }
 *  });
 *
 *  factory.createClient('renren');
 *
 *
 */
var factory = module.exports = function (platforms) {

  var snsClients = {};
  for(var name in platforms){
    snsClients[name] = {
        platform : name
      , key : platforms[name].key
      , secret : platforms[name].secret
    };
  }

  return {
    createClient : function(platform, user) {
      return factory.createClient(snsClients[platform], user);
    }
  };

};
/**
 * Set default app info (platform, key, secret) for common usage
 */
factory.setDefaultAppinfo = function setDefaultAppinfo(info){
  if(!info.platform || !info.key || !info.secret) return;

  defaultAppinfo = {};
  for(var key in info){
    defaultAppinfo[key] = info[key];
  }
}
factory.getDefaultAppinfo = function getDefaultAppinfo () {
  return defaultAppinfo;
}

/**
 * create a client by platform
 * @param {Object} appinfo a object contain key and secret, null is using default
 * @param {Object} user authorized_data in session
 */
factory.createClient = function createClient(appinfo, user) {
  // no appinfo, using default
  if(!appinfo || ( !appinfo.platform || !appinfo.key || !appinfo.secret)){
    if(!defaultAppinfo) return null;
    user = appinfo;
    appinfo = defaultAppinfo;
  }

  var client;
  switch(appinfo.platform){
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
