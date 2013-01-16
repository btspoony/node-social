/**
 * Client side common SNS Lib for multi-SNS platform project
 * @author Tang Bo Hao
 */

(function(exports) {

var social = exports.social = {};

function makeUrl(url, param) {
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + param;
}

/**
 * see http://wiki.dev.renren.com/wiki/Request_dialog for more information
 *
 * @param {Object} options
 *
 * required:
 *    redirect_uri:
 *    accept_url:
 *    actiontext
 *
 * optional:
 *    target : top, self
 *    modes : all,af,naf,wyxf // af - app friend, naf - non app friend, wyxf - wyx friend
 *    selectedMode: all, af, naf, wyxf
 *    pageSize:
 *    excluded_ids:
 *    style.width:
 *    style.height:
 *
 */
function genInviteHtml(options) {
  options = options || {};
  var url = appInfo.url;
  if(!url) {
    return '<p style="width:400px">accept_url is required</p>'
  }
  url = makeUrl(url, options.param);
  return [ '<div class="requestForm">'
  , '<form method="post" action="http://game.weibo.com/home/widget/requestForm" id="createToolFriend" target="friendSelector">'
  , '<input type="hidden" name="target" value="'       + ( options.target        || 'top') + '" />'
  , '<input type="hidden" name="appId" value="'        + ( appInfo.key) + '" />'
  , '<input type="hidden" name="modes" value="'        + ( options.modes         || 'all') + '" />'
  , '<input type="hidden" name="selectedMode" value="' + ( options.selector_mode || 'all') + '" />'
  , '<input type="hidden" name="action" value="'       + ( options.redirect_uri  || '') + '" />'
  , '<input type="hidden" name="excludedIds" value="'  + ( options.excluded_ids  || '') + '" />'
  , '<input type="hidden" name="pageSize" value="'     + ( options.page_size     || '12') + '" />'
  , '<input type="hidden" name="content" value="'      + ( options.msg || '欢迎加入') + '" />'
  , '<input type="hidden" name="callback" value="'     + ( url ) + '" />'
  , '</form>'
  , '<iframe width="' + (options.style && options.style.width || '600px') + '" height="' + (options.style && options.style.height || '460px') + '" frameborder="0" src="" name="friendSelector" scrolling="no" id="friendSelector">'
  , '</iframe>'
  , '</div>'
  ].join('');
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
  WYX.Connect.init();
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
  var $html = this.$html;
  if(!$html) {
    var html = this.genInviteHtml(options);
    $html = this.$html = $(html).hide();
    $("body").append($html);
    document.getElementById("createToolFriend").submit();
  }
  $html.modal();
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
  var uiOpts = {
    method:'sendWeibo',
    params:{
      appId: appInfo.id,
      title: options.title,
      content: options.summary,
      templateContent: options.msg,
      actionText: options.button,
      imageUrl: options.img
    }
  };
  var url = makeUrl(appInfo.url, options.param);
  uiOpts.link = uiOpts.actionUrl = url;
  WYX.Connect.send(uiOpts, callback);
}

social.authorize = function(redirect_uri, callback) {
  if(callback) callback();
}

})(window);
