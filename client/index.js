var exports = module.exports = require('./commonSNS');

exports.createClient = function(platform, appId) {
  switch(platform) {
  case 'wyx':
    return new exports.WyxClient(appId);
  case 'renren':
    exports.Renren.init({appId: appId});
    return exports.Renren;
  }
};
