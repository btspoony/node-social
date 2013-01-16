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
social.init = function(options) {
  appInfo = options;
  Renren.init({
      appId: appInfo.id
    , originPath : origin = location.protocol + '//' + location.host + location.pathname
  });
};

/**
 * invite options
 *   msg
 *   img
 *   button
 *   param
 *
 */
social.invite = function(options, callback) {
  options.accept_label = options.accept_label || '接受邀请';
  var params = {
    actiontext : options.msg
  , accept_label : options.button
  }
  var url = appInfo.url;
  if(url) {
    params.accept_url = makeUrl(url, options.param);
  }
  var uiOpts = {
      url: 'request'
    , display: 'iframe'
    , style : {top: 100, left: 100, right: 100, bottom: 100}
    , params : options
    , onSuccess : callback
  };
  Renren.ui(uiOpts);
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
  /*
   *    "url":"http://apps.renren.com/yourapp/welcome"
   *    "name":"新鲜事测试，这里是标题"
   *    "description":"现在我正在测试人人网新鲜事功能，不要理我"
   *    "image":"http://at-img4.tdimg.com/board/2011/5/46465.jpg"
   *    "action_name": "过来一起玩"
   *    "action_link":"http://apps.renren.com/yourapp/welcome"
   */
  var params = {
    name : options.title
  , description : options.msg
  , image : options.img
  , action_name : options.button
  };
  var url = appInfo.url;
  if(url) {
    params.url = params.action_link = makeUrl(url, param);
  }
  var uiOpts = {
      url : 'feed'
    , display : 'iframe'
    , style : {top: 100, left: 100, right: 100, bottom: 100}
    , params : params
    , onSuccess : callback
  }
  Renren.ui(uiOpts);
}

social.authorize = function(redirect_uri, callback) {
  var uiOpts = {
    url: 'http://graph.renren.com/oauth/authorize'
  , display: 'iframe'
  , style: {top: 100, left: 100, right: 100, bottom: 100}
  , params: {
      'response_type': 'code'
      // , 'client_id': settings['app_renren_key']
    , 'redirect_uri': redirect_uri
    }
  , onSuccess : callback
  };

  Renren.ui(uiOpts);
}

})(window);
