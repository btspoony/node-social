/**
 * OAuth Manager Factory
 * @author Tang Bo Hao
 */

var defaultPlatform = null;

/**
 * configure social
 *
 * @param platforms
 *    {platform_name : {key: key, secret: secret}}
 *
 *  you can set multi platforms
 *
 *  usage:
 *
 *  var factory = require('social')({
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
var factory = module.exports = function (configs) {

  for(var name in configs) {
    var clientClass;
    switch(name) {
    case 'wyx':
      clientClass = require('./wyx');
      break;
    case 'renren':
      clientClass = require('./renren');
      break;
    case 'qq':
      clientClass = require('./qq');
      break;
    default:
    }
    configs[name].platform = name;
    configs[name].clientClass = clientClass;
  }

  return {
    createClient : function(snsInfo) {
      var appinfo = configs[snsInfo.platform];
      // no appinfo, using default
      if(!appinfo){
        if(!defaultPlatform) return null;
        user = platform;
        appinfo = configs[defaultPlatform];
      }
      return new appinfo.clientClass(appinfo, snsInfo);
    },
    getAppEntryInfo : function(req) {
      for(var name in configs) {
        var config = configs[name];
        var entryInfo = config.clientClass.getAppEntryInfo(req, config.secret);
        if(entryInfo) return entryInfo;
      }
    },
    /**
     * set a default platform name
     */
    setDefault : function(platform){
      if(configs[platform])  defaultPlatform = platform;
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
    client = require('./wyx');
    break;
  case 'renren':
    client = require('./renren');
    break;
  case 'sina':
  default:
    client = require('./sina');
    break;
  }

  var ret = new client(appinfo, user);
  return ret;
}
