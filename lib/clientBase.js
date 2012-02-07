/**
 * The base class for all sns client
 * @author Tang Bo Hao
 */

// Module Dependence
var crypto= require('crypto'),
    http= require('http'),
    https= require('https'),
    URL= require('url'),
    querystring = require('querystring'),
    commonAPIs = require('./apiconfig').commonAPIs;

// export class
var clientBase = module.exports = function ClientBase(user){
};

clientBase.prototype.authorize = function authorize (req, res, callback, context){
  callback.call(context, new Error('missing implementation of authorize') );
};

clientBase.prototype.get = function get(api, param, callback, context) {
  callback.call(context, new Error('missing implementation of get') );
};

clientBase.prototype.post = function post(api, body, callback, context) {
  callback.call(context, new Error('missing implementation of post') );
};

/**
 * Generate user object by server data
 * each client should have their own version
 * return {Object}
 */
clientBase.prototype.geneCommonUser = function geneCommonUser( data ) {
  callback.call(context, new Error('missing implementation of geneUser') );
};

// ===! ===== Common SNS API ==========

clientBase.prototype.commonAPIGet = function commonAPIGet(apiname, param, callback, context) {
  var api = this.api[apiname];
  if(api) this.get(api, param, callback, context);
  else callback.call(context, new Error("not support api:" + apiname) );
};

clientBase.prototype.commonAPIPost = function commonAPIPost(apiname, param, callback, context) {
  var api = this.api[apiname];
  if(api) this.post(api, param, callback, context);
  else callback.call(context, new Error("not support api:" + apiname) );
};

// generate CommonAPIs function
var apiname, apimethod;
for (var key in commonAPIs) {
  apiname = commonAPIs[key];
  apimethod = apiname.substring(0, apiname.indexOf("_"));
  clientBase.prototype[key] = (function(name, method){
      return function(param, callback, context){
        var api = this.api[name];
        if(api) (this[method])(api, param, function(err, data){
            if(err) return callback.call( context, err);
            if(Array.isArray(data)){ // should be a array
              data = data.map(function(item){
                  return this.geneCommonUser(item);
              }, this);
            }else{ // should be a object
              data = this.geneCommonUser(data);
            }
            callback.call(context, null, data);
        }, this);
        else 
          callback.call(context, new Error("not support api:" + name) );
      };
  })(apiname, apimethod);
};

clientBase.prototype.checkSignature = function(query){
  return true;
}

// =====!===== Utility functions ============

clientBase.prototype._createClient= function( port, hostname, method, path, headers, sslEnabled ) {
  var options = {
    host: hostname,
    port: port,
    path: path,
    method: method,
    headers: headers
  };
  var httpModel;
  if( sslEnabled ) {
    httpModel= https;
  } else {
    httpModel= http;
  }
  return httpModel.request(options);     
};

clientBase.prototype._performSecureRequest= function( method, url, extra_params, post_content_type,  callback ) {

  if( !post_content_type ) {
    post_content_type= "application/x-www-form-urlencoded";
  }
  var parsedUrl= URL.parse( url, false );
  if( parsedUrl.protocol == "http:" && !parsedUrl.port ) parsedUrl.port= 80;
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) parsedUrl.port= 443;

  var headers= {
    "Accept" : "*/*",
    "Connection" : "close",
    "User-Agent" : "Node Server",
    "Host": parsedUrl.host};

  var post_body = null;
  if( (method == "POST" || method == "PUT")  && extra_params != null ) {
    post_body= querystring.stringify(extra_params);
  }

  headers["Content-length"]= post_body ? Buffer.byteLength(post_body) : 0;
  headers["Content-Type"]= post_content_type;

  var path;
  if( !parsedUrl.pathname  || parsedUrl.pathname == "" ) parsedUrl.pathname ="/";
  if( parsedUrl.query ) path= parsedUrl.pathname + "?"+ parsedUrl.query ;
  else path= parsedUrl.pathname;

  var request;
  if( parsedUrl.protocol == "https:" ) {
    request= this._createClient(parsedUrl.port, parsedUrl.hostname, method, path, headers, true);
  }
  else {
    request= this._createClient(parsedUrl.port, parsedUrl.hostname, method, path, headers);
  }
  if( callback ) {
    var data=""; 
    var self= this;

    var allowEarlyClose= true;
    var callbackCalled= false;
    function passBackControl( response ) {
      if(!callbackCalled) {
        callbackCalled= true;
        if ( response.statusCode >= 200 && response.statusCode <= 299 
          && data.indexOf('error_code') < 0 /* for wyx error_code*/) {
          callback(null, data, response);
        } else {
          callback({ statusCode: response.statusCode, data: data }, data, response);
        }
      }
    }

    request.on('response', function (response) {
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            data+=chunk;
        });
        response.on('end', function () {
            passBackControl( response );
        });
        response.on('close', function () {
            if( allowEarlyClose ) {
              passBackControl( response );
            }
        });
    });

    request.on("error", function(err) {
        callbackCalled= true;
        callback( err )
    });

    if( (method == "POST" || method =="PUT") && post_body != null && post_body != "" ) {
      request.write(post_body);
    }
    request.end();
  }
  else {
    if( (method == "POST" || method =="PUT") && post_body != null && post_body != "" ) {
      request.write(post_body);
    }
    return request;
  }

  return;
};
