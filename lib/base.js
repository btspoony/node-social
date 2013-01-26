/**
 * The base class for all sns client
 * @author Tang Bo Hao
 */

// Module Dependence
var crypto= require('crypto'),
    http= require('http'),
    https= require('https'),
    URL= require('url'),
    zlib= require('zlib'),
    querystring = require('querystring'),
    commonAPIs = require('./apiconfig').commonAPIs;

// export class
var SocialBase = module.exports = function ClientBase(user){
};

SocialBase.prototype.get = function get(api, param, callback) {
  callback(new Error('missing implementation of get') );
};

SocialBase.prototype.post = function post(api, body, callback) {
  callback(new Error('missing implementation of post') );
};

SocialBase.prototype.filterResponse = function(direct, reqCallback, err, data) {
  if(err) return reqCallback(err);
  if(direct) return reqCallback( null, data );

  if(Array.isArray(data)){ // should be a array
    data = data.map(function(item){
        return this.geneCommonUser(item);
    }, this);
  }else{ // should be a object
    data = this.geneCommonUser(data);
  }
  reqCallback(null, data);
};

/**
 * Generate user object by server data
 * each client should have their own version
 * return {Object}
 */
SocialBase.prototype.geneCommonUser = function geneCommonUser( data ) {
  return data;
};

// ===! ===== Common SNS API ==========
// generate CommonAPIs function
var apiname, apimethod, cfg, isDirect;
for (var key in commonAPIs) {
  apiname = key;
  cfg = commonAPIs[key].split("_");
  apimethod = cfg[0];
  isDirect = cfg[1] === "direct";
  SocialBase.prototype[apiname] = (function(name, method, direct){
      return function(param, callback){
        var api = this.api[name];
        if(api) 
          (this[method])(api, param, this.filterResponse.bind(this, direct, callback ) );
        else 
          callback(new Error("not support api:" + name) );
      };
  })(apiname, apimethod, isDirect);
};

SocialBase.checkSignature = function(query){
  return true;
}

SocialBase.prototype.verify = function (callback) {
  callback();
}

// =====!===== Utility functions ============

SocialBase.prototype._createClient= function( port, hostname, method, path, headers, sslEnabled ) {
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

SocialBase.prototype._performSecureRequest= function( method, url, extra_params, post_content_type,  callback ) {

  if( !post_content_type ) {
    post_content_type= "application/x-www-form-urlencoded";
  }

  var post_body = null;
  if(extra_params) {
    if( (method == "POST" || method == "PUT")  && extra_params != null ) {
      post_body= querystring.stringify(extra_params);
    } else {
      url += (url.indexOf('?') >= 0 ? '&' : '?')  + querystring.stringify(extra_params);
    }
  }

  var parsedUrl= URL.parse( url, false );
  if( parsedUrl.protocol == "http:" && !parsedUrl.port ) parsedUrl.port= 80;
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) parsedUrl.port= 443;
  
  var headers= {};
  headers["Accept"]= "*/*";
  headers["Accept-Encoding"]= "gzip";
  headers["Connection"]= "close";
  headers["User-Agent"]= "Node Server";
  headers["Host"]= parsedUrl.host;
  headers["Content-Length"]= post_body ? Buffer.byteLength(post_body) : 0;
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
    var self = this;

    var allowEarlyClose= true;
    var callbackCalled= false;

    function passBackControl( datastr, dataBuffers, response ) {
      if(!callbackCalled) {
        callbackCalled= true;
        if( dataBuffers ){
          datastr = Buffer.concat(dataBuffers).toString();
        }
        if ( response.statusCode >= 200 && response.statusCode <= 299 ) {
          callback(null, datastr, response);
        } else {
          callback({ statusCode: response.statusCode, data: datastr }, datastr, response);
        }
      }
    }

    var onResponse = function ( response) {
      var dataBuffers = null;
      var datastr = "";
      if( response.headers['content-length'] ){
        dataBuffers = [];
      }
      if (response.headers['content-encoding'] == 'gzip') {
        var gunzip = zlib.createGunzip();
        response.pipe(gunzip);
        gunzip.on('data', function (chunk) {
          dataBuffers.push( chunk );
        });
        gunzip.on('end', function () {
          passBackControl( null, dataBuffers, response );
        });
      }else{
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
          if( dataBuffers ){
            dataBuffers.push( new Buffer(chunk) );
          }else{
            datastr += chunk;
          }
        });
        response.on('end', function () {
          passBackControl( datastr, dataBuffers, response );
        });
      }
      response.on('close', function () {
        if( allowEarlyClose ) {
          passBackControl( datastr, dataBuffers, response );
        }
      });
    }

    request.on('response', onResponse );
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
