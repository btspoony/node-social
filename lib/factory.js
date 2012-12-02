/**
 * OAuth Manager Factory
 * @author Tang Bo Hao
 */

var _defaultPlatform = null;

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
module.exports = function (configs, is_debug_mode) {
  var Factory = {};

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

  Factory.createClient = function(snsInfo) {
    var appinfo = configs[snsInfo.platform];
    // no appinfo, using default
    if(!appinfo){
      if(!_defaultPlatform) return null;
      user = platform;
      appinfo = configs[_defaultPlatform];
    }
    return new appinfo.clientClass(appinfo, snsInfo, is_debug_mode);
  };

  Factory.getAppEntryInfo = function(req) {
    for(var name in configs) {
      var config = configs[name];
      var entryInfo = config.clientClass.getAppEntryInfo(req, config.secret);
      if(entryInfo) return entryInfo;
    }
  };

  /**
   * set a default platform name
   */
  Factory.setDefault = function(platform){
    if(configs[platform])  _defaultPlatform = platform;
  };

  return Factory;
};