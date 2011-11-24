/**
 * OAuth Manager Factory
 * @author Tang Bo Hao
 */

var defaultPlatform = null;

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
 *  factory.createClient('renren'); // create RenRen Client
 *
 *  factory.setDefault('renren'); // set RenRen as the default platform
 *  factory.createClient(); // now also can create RenRenClient
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
      var appinfo = snsClients[platform];
      // no appinfo, using default
      if(!appinfo){
        if(!defaultPlatform) return null;
        user = platform;
        appinfo = snsClients[defaultPlatform];
      }
      
      return createClient(appinfo, user);
    },
    /**
     * set a default platform name
     */
    setDefault : function(platform){
      if(snsClients[platform])  defaultPlatform = platform;
    }
  };

};

/**
 * create a client by platform
 * @param {Object} appinfo a object contain key and secret
 * @param {Object} user authorized_data in session
 */
function createClient(appinfo, user) {
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
