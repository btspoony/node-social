/**
 * How to use
 * 
 *  var snsclientlib = require('snsclient');
 *  var clientFactory = snsclientlib.clientFactory,
 * 		setDefaultAppinfo = snsclientlib.setDefaultAppinfo;
 *
 *  var client_nouser = clientFactory('wyx',{key:aa,secret:bb}); // for no authorized_user
 *
 *  setDefaultAppinfo({key:aa, secret:bb}); 
 *  client_nouser = clientFactory('wyx'); // for no authorized_user and using default
 *
 *  var client = clientFactory('wyx', authorized_user); // if set user and using default
 */

require.paths.unshift('./support');

exports.getTypeByQuery = require("./lib/clientFactory").getTypeByQuery;
exports.clientFactory = require("./lib/clientFactory").createClient;
exports.setDefaultAppinfo = require("./lib/clientFactory").setDefaultAppinfo;