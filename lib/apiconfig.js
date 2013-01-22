/**
 * API configuration file
 * @author Tang Bo Hao
 */

var commonAPIs = exports.commonAPIs = {
  // basic info
    account_info:   'get'
  , users_info:     'post'
  , appfriends_info:'post'
  , is_app_user:    'get_direct'
  , friends_ids:    'get_direct'
  , appfriends_ids: 'get_direct'
  // payment
  , payment_request: 'post_direct'
  , gettoken_request: 'post_direct'
  , confirm_payment: 'post_direct'
};

// Basic Sina App
var WeiboAPI = exports.WeiboAPI = {
  // specific api
  account_info:   '/account/verify_credentials'

  // Authorize
  , oauth_authorize:      '/oauth/authorize'
  , oauth_request_token:  '/oauth/request_token'
  , oauth_access_token:   '/oauth/access_token'
};

// Sina WeiYouXi
var WeiyxAPI = exports.WeiyxAPI = {
  // specific Api
    account_info: 'user/show' // get user info
  , users_info: 'user/show_batch' // get user info batch
  , friends_ids: 'user/friend_ids' // get all friends ids
  , appfriends_info: 'user/app_friends'  // get all friends(installed app)' info
  , appfriends_ids: 'user/app_friend_ids' // get all friends(installed app)' id
  , is_app_user: 'application/is_user' //check if the user installed app

  // Authorize Oauth2
  //,  oauth_site: 'http://game.weibo.com/oauth/'
  //,  oauth_authorize: 'auth/'
  //,  oauth_token: 'auth/token'
};

// RenRen
var RenRenAPI = exports.RenRenAPI = {
  // specific Api
    account_info:      'users.getInfo' // get user info
  , users_info:        'users.getInfo' // get user info
  , friends_ids:       'friends.get' // get friends ids
  , appfriends_ids:    'friends.getAppUsers' // get app friends ids
  , appfriends_info:   'friends.getAppFriends' // get app friends info
  , is_app_user:       'users.isAppUser' //check is app user

  // Authorize Oauth2
  , oauth_site: 'https://graph.renren.com/'
  , oauth_authorize: 'oauth/authorize'
  , oauth_token: 'oauth/token'
};

var QQAPI = exports.QQAPI = {
    account_info: '/v3/user/get_info'
  , users_info: '/v3/user/get_multi_info'
  , friends_ids: '/v3/relation/get_app_friends'
  , appfriends_ids: '/v3/relation/get_app_friends'
  , appfriends_info: '/v3/relation/get_app_friends'
  , is_app_user: '/v3/user/is_setup'

  // api for qq payment
  , payment_request: '/v3/pay/buy_goods'
  , gettoken_request: '/v3/pay/get_token'
  , confirm_payment: '/v3/pay/confirm_delivery'
}