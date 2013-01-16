/**
 * Client side common SNS Lib for multi-SNS platform project
 * @author Tang Bo Hao
 */

(function(exports) {

var social = exports.social = {};

function makeUrl(url, param) {
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + param;
}

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
  var uiOpts = {
    msg : options.msg
  , img : options.img
  }
  if(callback) {
    uiOpts.onSuccess = callback;
    // uiOpts.onCancel
    // uiOpts.onClose
  }
  fusion2.dialog.invite(uiOpts);
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
  if(!options.button) {
    options.button = '进入应用';
  }
  options.onSuccess = callback;
  fusion2.dialog.sendStory(options);
}

social.authorize = function(redirect_uri, callback) {
  if(callback) callback();
}

})(window);
