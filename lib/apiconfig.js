/**
 * API configuration file
 * @author Tang Bo Hao
 */

var commonAPIs = exports.commonAPIs = {
	acccount_info:	'get_account_info',
	friends_ids:		'get_friends_ids',
	appfriends_ids:	'get_appfriends_ids',
	appfriends_info:'get_appfriends_info',
	is_app_user:		'get_is_app_user',
};

// Basic Sina App
var WeiboAPI = exports.WeiboAPI = {
	// Basic Info
	apiurl: 'http://api.t.sina.com.cn',
	result_format: '.json',
	
	// specific api
	public_timeline:      '/statuses/public_timeline',
	friends_timeline:     '/statuses/friends_timeline',
	comments_timeline: 	  '/statuses/comments_timeline',
	user_timeline: 	      '/statuses/user_timeline',
	mentions:             '/statuses/mentions',
	followers:            '/statuses/followers',
	friends:              '/statuses/friends',
	favorites:            '/favorites',
	favorites_create:     '/favorites/create',
	favorites_destroy:    '/favorites/destroy/{{id}}',
	counts:               '/statuses/counts',
	status_show:          '/statuses/show/{{id}}',
	update:               '/statuses/update',
	upload:               '/statuses/upload',
	repost:               '/statuses/repost',
	repost_timeline:      '/statuses/repost_timeline',
	comment:              '/statuses/comment',
	reply:                '/statuses/reply',
	comment_destroy:      '/statuses/comment_destroy/{{id}}',
	comments:             '/statuses/comments',
	destroy:              '/statuses/destroy/{{id}}',
	destroy_msg:          '/direct_messages/destroy/{{id}}',
	direct_messages:      '/direct_messages', 
	sent_direct_messages: '/direct_messages/sent',
	new_message:          '/direct_messages/new',
	verify_credentials:   '/account/verify_credentials',
	rate_limit_status:    '/account/rate_limit_status',
	friendships_create:   '/friendships/create',
	friendships_destroy:  '/friendships/destroy',
	friendships_show:     '/friendships/show',
	reset_count:          '/statuses/reset_count',
	user_show:            '/users/show/{{id}}',

	// Authorize
	oauth_authorize: 	  '/oauth/authorize',
	oauth_request_token:  '/oauth/request_token',
	oauth_access_token:   '/oauth/access_token',
};
// common api
WeiboAPI[commonAPIs.acccount_info] = WeiboAPI.verify_credentials;

// Sina WeiYouXi
var WeiyxAPI = exports.WeiyxAPI = {
	// QueryKey NS
	NAMESPACE: "wyx_",

	// Basic Info
	apiurl: 'http://api.weibo.com/game/1/',
	result_format: '.json',
	
	// specific Api
	user_show: 'user/show', // get user info
	user_show_batch: 'user/show_batch', // get user info batch
	user_friends: 'user/friends', // get friends infos (limit 20)
	user_friend_ids: 'user/friend_ids', // get all friends ids
	user_app_friends: 'user/app_friends',  // get all friends(installed app)' info
	user_app_friend_ids: 'user/app_friend_ids', // get all friends(installed app)' id
	user_are_friends: 'user/are_friends', // check if they are friends
	friendships_show: 'friendships/show', // return two friends' relationship
	application_is_fan: 'application/is_fan', //check if the user is fans
	application_is_user: 'application/is_user', //check if the user installed app
	application_scored: 'application/scored', //check if the user scored app
	application_rate_limit_status: 'application/rate_limit_status', // get app api limit
	notice_send: 'Notice/send', // send single notification [closed now]
	invite_ignore_game_all: 'invite/ignore_game_all', // ignore all game invitation
	invite_ignore_game: 'invite/ignore_game', // ignore some user's game invitation
	pay_get_token: 'pay/get_token', // get payment token
	pay_order_status: 'pay/order_status', // check payment order status
	achievements_set: 'achievements/set', // set achievement
	achievements_get: 'achievements/get', // get achievement
	leaderboards_set: 'leaderboards/set', // set leader board
	leaderboards_get_friends: 'leaderboards/get_friends', // get friends leader boards
	leaderboards_increment: 'leaderboards/increment', // like 'set', but using increment
	leaderboards_get_total: 'leaderboards/get_total', // get total leader board
	engage_get_user_status: 'engage/get_user_status', // get user engage/s info

	// Authorize Oauth2
	// oauth_site: 'http://game.weibo.com/oauth/',
	// oauth_authorize: 'auth/',
	// oauth_token: 'auth/token',
};
// common api
WeiyxAPI[commonAPIs.acccount_info] = WeiyxAPI.user_show;
WeiyxAPI[commonAPIs.friends_ids] = WeiyxAPI.user_friend_ids;
WeiyxAPI[commonAPIs.appfriends_ids] = WeiyxAPI.user_app_friend_ids;
WeiyxAPI[commonAPIs.appfriends_info] = WeiyxAPI.user_app_friends;
WeiyxAPI[commonAPIs.is_app_user] = WeiyxAPI.application_is_user;

// RenRen
var RenRenAPI = exports.RenRenAPI = {
	// Basic Info
	apiurl: 'http://api.renren.com/restserver.do',
	result_format: 'JSON',
	
	// specific Api
	users_getInfo: 				'users.getInfo', // get user info
	users_isAppUser:			'users.isAppUser', //check is app user
	friends_get:					'friends.get', // get friends ids
	friends_getAppUsers:	'friends.getAppUsers', // get app friends ids
	friends_getAppFriends:'friends.getAppFriends', // get app friends info

	// Authorize Oauth2
	oauth_site: 'https://graph.renren.com/',
	oauth_authorize: 'oauth/authorize',
	oauth_token: 'oauth/token',
};
// common api
RenRenAPI[commonAPIs.acccount_info] = RenRenAPI.users_getInfo;
RenRenAPI[commonAPIs.friends_ids] = RenRenAPI.friends_get;
RenRenAPI[commonAPIs.appfriends_ids] = RenRenAPI.friends_getAppUsers;
RenRenAPI[commonAPIs.appfriends_info] = RenRenAPI.friends_getAppFriends;
RenRenAPI[commonAPIs.is_app_user] = RenRenAPI.users_isAppUser;
