/**
 * Client side common SNS Lib for multi-SNS platform project
 * @author Tang Bo Hao
 */

require('./lib/renren.js');

Renren.sendRequest = function(options){
  Renren.ui({
      url: 'request'
    , display: 'iframe'
    , style : {top: 100, left: 100, right: 100, bottom: 100}
    , params : {
        accept_label: options.accept_label || '接受邀请'
      }
    , onSuccess: options.onSuccess
    , onFailure: options.onFailure
  });
}

function WyxClient(){
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
 *    appId : your app Id
 *    target : top, self
 *    modes : all,af,naf,wyxf // af - app friend, naf - non app friend, wyxf - wyx friend
 *    selectedMode: all, af, naf, wyxf
 *    pageSize:
 *    excluded_ids:
 *    style.width:
 *    style.height:
 *
 */
WyxClient.prototype.genInviteHtml = function (options) {
  options = options || {};
  return [ '<div class="requestForm">'
  , '<form method="post" action="http://game.weibo.com/home/widget/requestForm" id="createToolFriend" target="friendSelector">'
  , '<input type="hidden" name="target" value="'       + ( options.target        || 'top') + '" />'
  , '<input type="hidden" name="appId" value="'        + ( options.app_id        || this.app_id) + '" />'
  , '<input type="hidden" name="modes" value="'        + ( options.modes         || 'all') + '" />'
  , '<input type="hidden" name="selectedMode" value="' + ( options.selector_mode || 'all') + '" />'
  , '<input type="hidden" name="action" value="'       + ( options.redirect_uri  || '') + '" />'
  , '<input type="hidden" name="excludedIds" value="'  + ( options.excluded_ids  || '') + '" />'
  , '<input type="hidden" name="pageSize" value="'     + ( options.page_size     || '12') + '" />'
  , '<input type="hidden" name="content" value="'      + ( options.actiontext    || '欢迎加入') + '" />'
  , '<input type="hidden" name="callback" value="'     + ( options.accept_url    || this.url) + '" />'
  , '</form>'
  , '<iframe width="' + (options.style && options.style.width || '600px') + '" height="' + (options.style && options.style.height || '460px') + '" frameborder="0" src="" name="friendSelector" scrolling="no" id="friendSelector">'
  , '</iframe>'
  , '</div>'
  , '<script type="text/javascript">'
  , 'function postForm(){'
  , 'document.getElementById("createToolFriend").submit();}if(window.attachEvent){window.attachEvent("onload", postForm);}else if(window.addEventListener){window.addEventListener("load", postForm, false);}</script>'
  ].join('');

}

/**
 * @param {Object} options
 */
WyxClient.prototype.sendRequest = function(options){
  var html = this.genInviteHtml(options);
  var $html = $(html).hide();
  $("body").append($html);
  $html.modal();
}

exports.Renren = Renren;
exports.WyxClient = WyxClient;
