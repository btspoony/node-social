/**
 * SNS Client middleware
 * @author Tang Bo Hao
 */
 
/**
 * get basic info from iframe query
 */
module.exports = function snsInfoMiddleware(snsFactory){
  // standalone client to checkSignature
  var _renren, _wyx;

  return function (req, res, next){
    var reqQuery = req.query;
    var snsInfo = {}, tmp;
    for(var key in reqQuery){
      tmp = decodeURI(key);
      // for renren iframe
      if(tmp.indexOf("xn_sig_")>=0){ 
        // lazy init, cause we don't know which platform supported
        _renren || (_renren = snsFactory.createClient('renren'));
        if(_renren.checkSignature(reqQuery)){
          snsInfo.platform = 'renren';
          snsInfo.snsId = reqQuery['xn_sig_user'] || "undefined";
          snsInfo.added = Boolean(reqQuery['xn_sig_added'] == 1);
        } else {
          return res.send('<h1>Bad request</h1>', 400);
        }
        break;
      }
      // for wyx iframe
      if(tmp.indexOf("wyx_")>=0){
        _wyx || (_wyx = snsFactory.createClient('wyx'));
        if(_wyx.checkSignature(reqQuery)) {
          snsInfo.platform = 'wyx';
          snsInfo.snsId = reqQuery['wyx_user_id'] || "undefined";
          snsInfo.added = true;
        } else {
          return res.send('<h1>Bad request</h1>', 400);
        }
        break;
      }
    }
    // if platform exists, set a userid
    if(snsInfo.platform){
      snsInfo.userId = snsInfo.platform+'.'+snsInfo.snsId;
      // set to request object
      req.snsInfo = snsInfo;
    }

    // go next
    next();
  };

}
