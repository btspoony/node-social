/**
 * Client side common SNS Lib for multi-SNS platform project
 * @author Tang Bo Hao
 */

(function(exports) {

var social = exports.social = {};

var appInfo;
/**
 * @param options
 *    platform
 *    id // renren, wyx
 *    url // renren, wyx
 */
social.init = function(initOpt) {
  appInfo = initOpt;
};

/**
 * invite options
 * @param options
 *    msg, img
 */
social.invite = function(options, callback) {
  options.onSuccess = options.onSuccess || callback;
  fusion2.dialog.invite(options);
}

/**
 * @param options
 *  title
 *  summary
 *  msg
 *  img
 *  param
 *
 *  button
          // 必须。操作区的文字，只能填写下面四种中的一种：
          // 1.进入应用 2.领取奖励 3. 获取能量 4.帮助TA。
 */
social.share = function(options, callback) {
  options.onSuccess = options.onSuccess || callback;
  fusion2.dialog.sendStory(options);
}

/**
 * @param  {Object}   options  
 *         disturb - true
 *         param - url_param
 */
social.buy = function(options, callback){
  options.onSuccess = options.onSuccess || callback;
  fusion2.dialog.buy(options);
}

social.authorize = function(redirect_uri, callback) {
  if(callback) callback();
}

})(window);
