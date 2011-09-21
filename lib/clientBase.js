/**
 * The base class for all sns client
 * @author Tang Bo Hao
 */

// Module Dependence
var crypto= require('crypto'),
	http= require('http'),
	https= require('https'),
	URL= require('url'),
	querystring = require('querystring');

// export class
var clientBase = module.exports = function ClientBase(user){
};

clientBase.prototype.authorize = function authorize (req, res, next_url, callback, context){
	callback.call(context, new Error('missing implementation of authorize') );
};

clientBase.prototype.get = function get(api, param, callback, context) {
	callback.call(context, new Error('missing implementation of get') );
};

clientBase.prototype.post = function post(api, body, callback, context) {
	callback.call(context, new Error('missing implementation of post') );
};

// ===! ===== Common SNS API ==========

clientBase.prototype.getAccountInfo = function getAccountInfo (session, callback, context) {
	var api = this.api.user_getInfo;
	this.get(api, null,	function(err, data) {
		if(err) return callback.call(context, err);
		
		session.accountInfo = data;
		callback.call(context, null, data);
	});
};

// =====!===== Utility functions ============
/**
 * build signature
 * @param {String} baseStr base string
 * @param {String} secret app secret
 * @param {String} method sha1 or md5
 */
clientBase.prototype._buildSignature = function buildSignature(baseStr, secret, hashmethod){
	if(hashmethod !== 'sha1' || hashmethod !== 'md5') hashmethod = 'sha1';
	
	return crypto.createHash(hashmethod).update(baseStr+secret).digest('hex');
};

/**
 * build base string
 * @param {Object}
 */
clientBase.prototype._buildBaseString = function buildBaseString(paramObj, useRawValue, withoutsep) {
	if(!paramObj) return "";
	
	var argument_pairs= this._makeArrayOfArgumentsHash(paramObj);
	
	if(!useRawValue){
		// First encode them
		for(var i=0;i<argument_pairs.length;i++) {
		  argument_pairs[i][0]= this._encodeData( argument_pairs[i][0] );
		  argument_pairs[i][1]= this._encodeData( argument_pairs[i][1] );
		}
	}

	// Then sort them
	argument_pairs= this._sortRequestParams( argument_pairs );

	// Then concatenate together
	var param= "";
	for(var i=0;i<argument_pairs.length;i++) {
	    param+= argument_pairs[i][0];
	    param+= "="
	    param+= argument_pairs[i][1];
	    if( i < argument_pairs.length-1 && !withoutsep ) param+= "&";
	}     
	return param;
};

clientBase.prototype._encodeData= function(toEncode){
 if( toEncode == null || toEncode == "" ) return ""
 else {
    var result= encodeURIComponent(toEncode);
    // Fix the mismatch between OAuth's  RFC3986's and Javascript's beliefs in what is right and wrong ;)
    return result.replace(/\!/g, "%21")
                 .replace(/\'/g, "%27")
                 .replace(/\(/g, "%28")
                 .replace(/\)/g, "%29")
                 .replace(/\*/g, "%2A");
 }
};

// Sorts the encoded key value pairs by encoded name, then encoded value
clientBase.prototype._sortRequestParams= function(argument_pairs) {
  // Sort by name, then value.
  argument_pairs.sort(function(a,b) {
      if ( a[0]== b[0] )  {
        return a[1] < b[1] ? -1 : 1; 
      }
      else return a[0] < b[0] ? -1 : 1;  
  });

  return argument_pairs;
};

// Takes an object literal that represents the arguments, and returns an array
// of argument/value pairs.
clientBase.prototype._makeArrayOfArgumentsHash= function(argumentsHash) {
  var argument_pairs= [];
  for(var key in argumentsHash ) {
       var value= argumentsHash[key];
       if( Array.isArray(value) ) {
         for(var i=0;i<value.length;i++) {
           argument_pairs[argument_pairs.length]= [key, value[i]];
         }
       }
       else {
         argument_pairs[argument_pairs.length]= [key, value];
       }
  }
  return argument_pairs;  
};

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