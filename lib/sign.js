var crypto = require('crypto');

/**
 * utils to make signature, check signature
 */

var encodeData = exports.encodeData = function (toEncode) {
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

/**
 * sort query object to string, e.g. {a:1, b:2, c:3} to 'a=1&b=2&c=3'}
 * @param {Object} query
 * @param {String} concat default '&'
 * @param {Boolean} encode default true
 */
exports.sortQueryToString = function (query, concat, encode) {
  return sortQueryToArray(query, encode).join(concat === undefined ? '&' : concat);
}

/**
 * sort query object to array of string, e.g. {a:1, b:2, c:3} to ['a=1', 'b=2', 'c=3'].
 *
 * @param {Object} query query Object
 * @param {Boolean} encode encode key value with encodeURI, default true.
 */
var sortQueryToArray = exports.sortQueryToArray = function (query, encode/* =true */) {
  var result = [];
  for(var key in query) {
    if(encode === false) {
      result.push(key + '=' + query[key]);
    } else {
      result.push(encodeData(key) + '=' + encodeData(query[key]));
    }
  }

  return result.sort();
}

exports.removePrefix = function (query, prefix) {
  var result = {};
  for(var key in query) {
    if(key.indexOf(prefix) === 0) {
      result[key.substring(prefix.length)] = query[key];
    } else {
      result[key] = query[key];
    }
  }
  return result;
}

/**
 *
 */
exports.removeField = function (query /*, fieldname... */) {
  var result = {},
      fieldnames = Array.prototype.slice.call(arguments, 1);
  for(var key in query) {
    if(fieldnames.indexOf(key) < 0) {
      result[key] = query[key];
    }
  }
  return result;
}

/**
 * build sign
 * @param {String} baseStr base string
 * @param {String} secret app secret
 * @param {String} method sha1 or md5
 */
exports.buildSign = function (baseStr, secret, hashmethod){
  if( !hashmethod ) hashmethod = 'sha1';

  return crypto.createHash(hashmethod).update(baseStr+secret).digest('hex');
};
