/**
 * SNS Client middleware
 * @author Tang Bo Hao
 */

var clientFactory = require('./clientFactory');

/**
 * get basic info from iframe query
 */
module.exports = function snsInfoMiddleware(options){
  var snsClients = {};
  for(var platform in options){
    snsClients[platform] = clientFactory.createClient({
        type: platform
        , key : options[platform].key
        , secret : options[platform].secret
    });
  }

  return function (req, res, next){
    var reqQuery = req.query;
    var snsInfo = {}, tmp;
    for(var key in reqQuery){
      tmp = decodeURI(key);
      if(tmp.indexOf("xn_sig_")>=0){ // for renren iframe
        if(snsClients.renren.checkSignature(reqQuery)){
          snsInfo.type = 'renren';
          snsInfo.snsid = reqQuery['xn_sig_user'] || "undefined";
          snsInfo.added = Boolean(reqQuery['xn_sig_added'] == 1);
        } else {
          return res.send('<h1>Bad request</h1>', 400);
        }
        break;
      }
      if(tmp.indexOf("wyx_")>=0){ // for wyx iframe
        snsInfo.type = 'wyx';
        snsInfo.snsid = reqQuery['wyx_user_id'] || "undefined";
        snsInfo.added = true;
        break;
      }
    }
    // if type exists, set a userid
    if(snsInfo.type) snsInfo.userid = snsInfo.type+'.'+snsInfo.snsid;

    // set to request object
    req.snsInfo = snsInfo;

    // go next
    next();
  };
}
