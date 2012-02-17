/**
 * Client side common SNS Lib for multi-SNS platform project
 * @author Tang Bo Hao
 */
if(Renren) {
  exports.Renren = Renren;
  Renren.sendRequest = function(options){
    Renren.ui({
        url: 'request'
      , display: 'iframe'
      , style : {top: 100, left: 100, right: 100, bottom: 100}
      , params : {
          accept_label: options.accept_label || '接受邀请'
        }
      , onSuccess: options.onSuccess || function(r){}
      , onFailure: options.onFailure || function(r){}
    });
  }
}

var WYX = exports.WYX = function (appId){
  this.appId = appId;
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
WYX.prototype.genInviteHtml = function (options) {
  options = options || {};
  if(!options.accept_url) {
    return '<p style="width:400px">accept_url is required</p>'
  }
  return [ '<div class="requestForm">'
  , '<form method="post" action="http://game.weibo.com/home/widget/requestForm" id="createToolFriend" target="friendSelector">'
  , '<input type="hidden" name="target" value="'       + ( options.target        || 'top') + '" />'
  , '<input type="hidden" name="appId" value="'        + ( options.appId         || this.appId) + '" />'
  , '<input type="hidden" name="modes" value="'        + ( options.modes         || 'all') + '" />'
  , '<input type="hidden" name="selectedMode" value="' + ( options.selector_mode || 'all') + '" />'
  , '<input type="hidden" name="action" value="'       + ( options.redirect_uri  || '') + '" />'
  , '<input type="hidden" name="excludedIds" value="'  + ( options.excluded_ids  || '') + '" />'
  , '<input type="hidden" name="pageSize" value="'     + ( options.page_size     || '12') + '" />'
  , '<input type="hidden" name="content" value="'      + ( options.actiontext    || '欢迎加入') + '" />'
  , '<input type="hidden" name="callback" value="'     + ( options.accept_url ) + '" />'
  , '</form>'
  , '<iframe width="' + (options.style && options.style.width || '600px') + '" height="' + (options.style && options.style.height || '460px') + '" frameborder="0" src="" name="friendSelector" scrolling="no" id="friendSelector">'
  , '</iframe>'
  , '</div>'
  ].join('');

}

/**
 * @param {Object} options
 */
WYX.prototype.sendRequest = function(options){
  var $html = this.$html;
  if(!$html) {
    var html = this.genInviteHtml(options);
    $html = this.$html = $(html).hide();
    $("body").append($html);
    document.getElementById("createToolFriend").submit();
  }
  $html.modal();
}

var QQ = {
    sendRequest : function(options) {
      fusion2.dialog.invite
      ({

          // 可选，微博平台不可使用该参数。邀请理由，最长不超过35个字符。若不传则默认在弹框中显示"这个应用不错哦，跟我一起玩吧！"
          msg  :"邀请你来玩~",

          // 可选，微博平台不可使用该参数。
          //邀请配图的URL，图片尺寸最大不超过120*120 px。若不传则默认在弹框中显示应用的icon
          // hosting应用要求将图片存放在APP域名下或腾讯CDN
          // non-hosting应用要求将图片上传到该应用开发者QQ号对应的QQ空间加密相册中。
          img :"http://qzonestyle.gtimg.cn/qzonestyle/act/qzone_app_img/app353_353_75.png",

          // 可选。透传参数，用于onSuccess回调时传入的参数，用于识别请求
          context :"invite",

          // 可选。用户操作后的回调方法。
          onSuccess : function (opt) {  alert("邀请成功" + opt.context); },

          // 可选。用户取消操作后的回调方法。
          onCancel : function () { alert("邀请取消"); },

          // 可选。对话框关闭时的回调方法。
          onClose : function () {  alert("邀请关闭"); }

      });
    }
  , invite : fusion2.dialog.invite
  , share : fusion2.dialog.share
  , sendStory : fusion2.dialog.sendStory
}

exports.createClient = function(platform, appId) {
  switch(platform) {
  case 'wyx':
    return new WYX(appId);
  case 'renren':
    Renren.init({appId: appId});
    return Renren;
  case 'qq':
    return QQ;
  }
};
