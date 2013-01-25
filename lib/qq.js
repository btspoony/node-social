var util = require('util'),
    crypto = require('crypto'),
    sign = require('./sign'),
    urlparse = require('url').parse,
    querystring = require('querystring'),
    SocialBase = require('./base');

var oauth_site = 'openapi.tencentyun.com'
  , debug_oauth_site = '119.147.19.43';

var QQ = module.exports = function (appinfo, data, debug) {
  SocialBase.call(this);
  this.platform = 'qq';
  this.appid = appinfo.key;
  this.secret = appinfo.secret;
  this.appinfo = appinfo;
  this.is_debug = debug;
  this.data = data;
}
util.inherits(QQ, SocialBase);

QQ.prototype.api = require('./apiconfig').QQAPI;

QQ.prototype.get = function(uri, query, callback) {
  return this.request('GET', false, uri, query, callback);
}

QQ.prototype.post = function(uri, param, callback) {
  var isHttps = uri == this.api.payment_request 
             || uri == this.api.confirm_payment;
  return this.request('POST', isHttps, uri, param, callback);
}

QQ.prototype.request = function(method, isHttps, uri, params, callback) {
  var src = method.toUpperCase();
  src += '&' + sign.encodeData(uri);
  params.openid = this.data.snsId;
  params.openkey = this.data.sessionKey;
  params.pf = this.data.pf;
  params.appid = this.appid;
  params.format = "json";

  if( params.sig ) delete params.sig;

  var basestring = sign.sortQueryToString(params, '&', false);
  src += '&' + sign.encodeData(basestring);
  var sig = crypto.createHmac('sha1', this.secret + '&').update(src).digest('base64');
  params.sig = sig;
  var url = (isHttps?"https://":"http://") 
            +(this.is_debug ? debug_oauth_site : oauth_site)
            +uri;
  this._performSecureRequest(method, url, params, null, function(err, data, response) {
      if(err) return callback(err);

      if(data) {
        var obj = JSON.parse(data);
        if(obj.ret == 0) {
          callback(null, obj);
        } else {
          callback(url + ' returns:\n' + data +'\n parms:'+ JSON.stringify(params));
        }
      } else {
        callback(null, data);
      }
  });
}

/**
 * Override FilterResponse
 */
QQ.prototype.filterResponse = function(direct, reqCallback, err, data) {
  if( data ){
    if( data.ret != "0" || data.ret != 0 ){
      err = { ret: data.ret, msg: data.msg };
    }else{
      if(data.ret !== undefined ) delete data.ret;
      if(data.is_lost !== undefined ) delete data.is_lost;
    }
  }
  SocialBase.prototype.filterResponse.call(this, direct, reqCallback, err, data );
};

QQ.getAppEntryInfo = function (req) {
  var query = req.query;
  var openid = query['openid'],
      openkey = query['openkey'];

  if(openid && openkey) {
    var info = {};
    for( var key in query ){
      info[key] = query[key];
    }
    info.platform = 'qq';
    info.snsId = openid;
    info.added = true;
    info.sessionKey = openkey;
    return info;
  }
}

QQ.prototype.geneCommonUser = function (data) {
  if( !data.items ){
    data.id = this.data.snsId;
    return _formatUser( data );
  }else{ 
    var items = data.items.map( _formatUser );
    return items;
  }
}

function _formatUser( data ){
  if( data.openid != undefined ){
    data.id = data.openid;
    delete data.openid;
  }

  data.gender = data.gender == '男';

  if( data.figureurl != undefined ){
    data.imageUrl = data.imageUrlMiddle = data.imageUrlLarge = data.figureurl;
    var img = data.figureurl;
    var i = img.lastIndexOf('/');
    // data.imageUrl = img.substring(0, i) + '/30';
    data.imageUrl = data.imageUrlMiddle = img;
    data.imageUrlLarge = img.substring(0, i) + '/100';
    delete data.figureurl;
  }

  if( data.nickname != undefined ){
    data.name = data.nickname;
    delete data.nickname; 
  }

  if( data.is_yellow_vip != undefined ){
    data.isSpecial = !!data.is_yellow_vip;
    delete data.is_yellow_vip;
  }
  
  if( data.yellow_vip_level != undefined ){
    data.specialType = Number(data.yellow_vip_level);
    delete data.yellow_vip_level;
  }

  return data;
}

// node-social common API
QQ.prototype.account_info = function (param, callback) {
  param = param || {};
  param["flag"] = "0";
  SocialBase.prototype.account_info.call(this, param, callback );
};

QQ.prototype.users_info = function( param, callback ) {
  if( !param["fopenids"] ) return callback( null, [] );

  SocialBase.prototype.users_info.call( this, param, callback );
};

// lack of appfriends info api, use two step to get all friends info
QQ.prototype.appfriends_info = function(param, callback) {
  param = param || {};
  var self = this;
  SocialBase.prototype.appfriends_ids.call(this, param, function(err, data){
    if(err) return callback(err);
    var items = data.items.map(function(e) {return e.openid});
    param['fopenids'] = items.join("_");
    self.users_info(param, callback);
  });
};

QQ.prototype.friends_ids = function(param, callback) {
  this.appfriends_ids(param, callback);
};

QQ.prototype.appfriends_ids = function (param, callback) {
  SocialBase.prototype.appfriends_ids.call(this, param, function(err, data){
    if(err) return callback(err);

    var items = data.items.map(function(e) {return e.openid});
    callback(null, items);
  });
}

// ========= Payment Request ============
// 
QQ.prototype.gettoken_request = function( param, callback ){
  // setup param
  if( !param 
    ||!param.discountid){
    return callback( new Error('lack of parameters') );
  }

  // must have
  param.ts = String(Date.now() / 1000);
  param.pfkey = this.data.pfkey;
  param.tokentype = param.tokentype || "1";
  param.zoneid = param.zoneid || "0";
  param.version = 'v3';

  SocialBase.prototype.gettoken_request.call( this, param, callback );
}

/**
 * Payment start api
 * @param  {Object}   param    Request parameters ( refer to http://wiki.open.qq.com/wiki/v3/pay/buy_goods )
 *                             must have: { payitem, goodsmeta, goodsurl }
 *                             optional : { amt, amttype, appmode, zoneid, manyouid, present, paymode, cee_extend }
 * @param  {Function} callback 
 */
QQ.prototype.payment_request = function(param, callback ) {
  // setup param
  if( !param 
    ||!param.payitem
    ||!param.goodsmeta
    ||!param.goodsurl){
    return callback( new Error('lack of parameters') );
  }

  // must have
  param.ts = String(Date.now() / 1000);
  param.pfkey = this.data.pfkey;
  // optional
  param.appmode = param.appmode || "2";
  param.zoneid = param.zoneid || "0";
  param.present = param.present || "0";
  
  SocialBase.prototype.payment_request.call( this, param, callback );
};

var reg = /[^0-9a-zA-Z\!\*\(\)]/g;
/**
 * When payment completed you should call this function to confirm finish
 * @param {Object}   req      the req of express ( the req from platform send to you with all payment info)
 * @param {Object}   res      the res of express
 * @param {Function} onSuccess called when sig check passed, do some db change and callback to start confirm
 *                             eg: function( callback ) {}
 * @param {Function} onFail    called when sig check failed, just log it and callback to start confirm
 *                             eg: function( callback ) {}
 * @param {Function} onDelivery (Optional)if provide snsData, you should give this onDelivery function, it will be called 
 *                              when confirm_payment finished
 */
QQ.prototype.payment_callback = function( req, res, onSuccess, onFail, onDelivery ) {
  var query = req.query, isSuccess;
  // special query value encode for qq payment
  var reqsig = decodeURIComponent( query.sig );
  var queryData = {};
  for( var key in query ){
    if( key !== 'sig' )
      queryData[key] = query[key].replace( reg, _specialReplaceDate );
  }

  var method = req.route.method.toUpperCase();
  var uri = req.path;
  var src = method + '&' + sign.encodeData(uri);
  var basestring = sign.sortQueryToString(queryData, '&', false);
  src += '&' + sign.encodeData(basestring);
  var sig = crypto.createHmac('sha1', this.secret + '&').update(src).digest('base64');

  // propearing response to platform and start confirm delivery
  var responseFunc = function( ret ) {
    var msg;
    switch( ret ){
      case '0': msg = "OK"; break;
      case '1': msg = "Game Server Error"; break;
      case '4': msg = "Parameter Error: (sig)"; break;
    }
    // send response to platform
    res.json({ ret: ret, msg: msg });
    
    // if provide sns data, confirm_payment request will be called automatically
    if( this.data && onDelivery != null ){
      // setup confirm Param then send confirm
      var confirmParam = {};
      // res parameters
      confirmParam.provide_errno = ret;
      confirmParam.provide_errmsg = msg;
      // url paramters
      confirmParam.payitem = query.payitem;
      confirmParam.token_id = query.token;
      confirmParam.billno = query.billno;
      confirmParam.version = query.version;
      confirmParam.zoneid = query.zoneid;
      confirmParam.providetype = query.providetype || "0";
      // payment values
      confirmParam.amt = query.amt || "0"; // unit: 0.1 Q point
      confirmParam.payamt_coins = query.payamt_coins || "0";
      confirmParam.pubacct_payamt_coins = query.pubacct_payamt_coins || "0";
      
      // call confirm_payment
      this.confirm_payment( confirmParam, onDelivery );
    }
  }
  var retno;
  if( reqsig === sig ){ // call onSuccess
    // call customized onSuccess function
    var self = this;
    onSuccess(function (err, data){
      if( err ){
        responseFunc.call(self, '1');
      }else{
        responseFunc.call(self, '0');
      }
    });
  }else{
    // call customized onFail function
    onFail( responseFunc.bind(this, '4' ));
  }
}

/**
 * Special parameter replace for payment
 * @param  {String} char
 * @return {String} replaced char
 */
function _specialReplaceDate( char ){
  return "%"+ char.charCodeAt(0).toString(16).toUpperCase();
}

/**
 * Invoked by payment_callback, or you can call it directly
 * @param  {Object}   param    Request parameters ( refer to http://wiki.open.qq.com/wiki/v3/pay/payment_callback )
 * @param  {Function} callback
 */
QQ.prototype.confirm_payment = function( param, callback ) {
  // setup param
  if( !param 
    ||!param.payitem
    ||!param.token_id
    ||!param.billno
    ||!param.provide_errno){
    return callback( { ret: 4, msg:'lack of parameters' } );
  }
  // must have
  param.ts = String(Date.now() / 1000);
  // optional
  param.zoneid = param.zoneid || "0";
  param.amt = param.amt || "0";
  param.payamt_coins = param.payamt_coins || "0";
  param.pubacct_payamt_coins = param.pubacct_payamt_coins || "0";
  
  var self = this;
  SocialBase.prototype.confirm_payment.call( this, param
    , function(err, data){
    if( err ){
      // special ret code for retry
      var ret = err.ret;
      if( ret == 1062 || ret == 1099 ){ // 1062 is too early, 1099 is busy
        // Confirm again...
        self.confirm_payment( param, callback );
        return;
      }
    }
    callback( err, data );
  });
};