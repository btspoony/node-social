/**
 * SNS Client middleware
 * @author Tang Bo Hao
 */

/**
 * get basic info from iframe query
 */
module.exports = function snsInfoMiddleware(options){
	// TODO config some options
	return function (req, res, next){
		var reqQuery = req.query;

		var snsInfo = {}, tmp;
		for(var key in reqQuery){
			tmp = decodeURI(key);
			if(tmp.indexOf("xn_sig_")>=0){ // for renren iframe
				snsInfo.type = 'renren';
				snsInfo.snsid = reqQuery['xn_sig_user'] || "undefined";
				snsInfo.added = Boolean(reqQuery['xn_sig_added'] == 1);
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