/**
 * Client side common SNS Lib for multi-SNS platform project
 * @author Tang Bo Hao
 */

(function(exports) {

var social = exports.social = {};

function makeUrl(url, param) {
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + options.param;
}

social.Renren = {
    init : function (appinfo) {
      Renren.init({
          appId: appinfo.id
        , originPath : origin = location.protocol + '//' + location.host + location.pathname
      });
      this.appinfo = appinfo;
    }
  , authorize : function (redirect_uri, callback) {
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
  /**
   * @param options
   *    msg, button, param
   */
  , invite : function (options, callback) {
      options.accept_label = options.accept_label || '接受邀请';
      var params = {
        actiontext : options.msg
      , accept_label : options.button
      }
      var url = this.appinfo.url;
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
   *     title, summary, msg, img, button, param
   */
  , share : function (options, callback) {
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
      var url = this.appinfo.url;
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
}

social.WYX = {
  init : function(appinfo) {
    WYX.Connect.init();
    this.appinfo = appinfo;
  }
, authorize : function(redirect_uri, callback) {
    if(callback) callback();
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
, genInviteHtml : function (options) {
  options = options || {};
  var url = this.appinfo.url;
  if(!url) {
    return '<p style="width:400px">accept_url is required</p>'
  }
  url = makeUrl(url, options.param);
  return [ '<div class="requestForm">'
  , '<form method="post" action="http://game.weibo.com/home/widget/requestForm" id="createToolFriend" target="friendSelector">'
  , '<input type="hidden" name="target" value="'       + ( options.target        || 'top') + '" />'
  , '<input type="hidden" name="appId" value="'        + ( this.appinfo.id) + '" />'
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

/**
 * @param {Object} options
 *    msg, param
 */
, invite : function(options){
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
 *  button
 *  param
 */
, share : function (options, callback) {
    var uiOpts = {
      method:'sendWeibo',
      params:{
        appId: this.appinfo.id,
        title: options.title,
        content: options.summary,
        templateContent: options.msg,
        actionText: options.button,
        imageUrl: options.img
      }
    };
    var url = makeUrl(this.appinfo.url, options.param);
    uiOpts.link = uiOpts.actionUrl = url;
    WYX.Connect.send(uiOpts, callback);
  }

}

var QQ = {
    init : function (appinfo) {
      this.appinfo = appinfo;
    }
  , authorize : function (redirect_uri, callback) {
      if(callback) callback();
    }
    /**
     * @param options
     *    msg, img
     */
  , invite : function(options, callback) {
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
     *   title
     *   summary
     *   msg
     *   img
     *   button
     *   param
     */
  , share : function(options, callback) {
      if(!options.button) {
        options.button = '进入应用';
      }
      options.onSuccess = callback;
      fusion2.dialog.sendStory(options);
    }
}

var api;
/**
 * @param options
 *    platform
 *    id // renren, wyx
 *    url // renren, wyx
 */
social.init = function(options) {
  switch(options.platform) {
  case 'wyx':
    api = social.WYX;
    api.init(options);
    break;
  case 'renren':
    api = social.Renren;
    api.init(options);
    break;
  case 'qq':
    api = social.QQ;
    api.init(options);
    break;
  default:
    api = null;
  }
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
  api.invite(options, callback);
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
  api.share(options, callback);
}

social.authorize = function(redirect_uri, callback) {
  api.authorize(redirect_uri, callback);
}

})(exports || window);
