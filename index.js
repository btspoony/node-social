/**
 * How to use
 * 
 *  var snsclientlib = require('snsclient');
 *  var createClient = snsclientlib.createClient,
 * 		setDefaultAppinfo = snsclientlib.setDefaultAppinfo;
 *
 *  var client_nouser = createClient('wyx',{key:aa,secret:bb}); // for no authorized_user
 *
 *  setDefaultAppinfo({key:aa, secret:bb}); 
 *  client_nouser = createClient('wyx'); // for no authorized_user and using default
 *
 *  var client = createClient('wyx', authorized_user); // if set user and using default
 */

require.paths.unshift('./support');

exports.getTypeByQuery = require("./lib/clientFactory").getTypeByQuery;
exports.createClient = require("./lib/clientFactory").createClient;
exports.setDefaultAppinfo = require("./lib/clientFactory").setDefaultAppinfo;