/**
 * Client side common SNS Lib for multi-SNS platform project
 * @author Tang Bo Hao
 */

(function(exports) {

var social = exports.social = {};

var sandbox;
social.init = function(initOpt) {
  sandbox = initOpt.sandbox;
};

social.invite = function(options, callback) {
  if( callback ) 
    options.onSuccess = options.onSuccess || callback;
  fusion2.dialog.invite(options);
}

social.share = function(options, callback) {
  if( callback ) 
    options.onSuccess = options.onSuccess || callback;
  fusion2.dialog.sendStory(options);
}

social.buy = function(options, callback){
  options.sandbox = sandbox;
  fusion2.dialog.buy(options);
}

social.checkBalance = function( callback ) {
  var options = {};
  options.onClose = callback;
  fusion2.dialog.checkBalance(options);
}

social.recharge = function( callback ) {
  var options = {};
  options.onClose = callback;
  fusion2.dialog.recharge(options);
}

})(window);
