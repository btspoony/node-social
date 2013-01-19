/**
 * OAuth Manager Factory
 * @author Tang Bo Hao
 */

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

  /**
   * Create a social client
   * @param  {String/Object} snsInfo platform name or snsInfo from getAppEntryInfo
   * @return {Object}         Social platform instance
   */
  Factory.createClient = function(snsInfo) {
    var pf;
    if( typeof snsInfo === "string"){
      pf = snsInfo;
      snsInfo = null;
    }else{
      pf = snsInfo.platform;
    }
    var appinfo = configs[pf];
    // no appinfo, return null
    if(!appinfo) return null;
    return new appinfo.clientClass(appinfo, snsInfo, is_debug_mode);
  };

  Factory.getAppEntryInfo = function(req) {
    for(var name in configs) {
      var config = configs[name];
      var entryInfo = config.clientClass.getAppEntryInfo(req, config.secret);
      if(entryInfo) return entryInfo;
    }
  };

  return Factory;
};