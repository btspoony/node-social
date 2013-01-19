# Multi-platform Social Client for Node
This is general Social Client libs for most china's social network platforms.(iFrame Social Games)

### Basic Common API Implemented:
* "qq" - QZone/Pengyou
* "wyx" - Sina Weiyouxi (Old style FB like, in-frame only, implemented)
* "renren" - RenRen (OAuth2, implemented)

### Payment Implemented:
* "qq" - QZone/Pengyou

### Not implement yet:
* "fb" - Facebook

## Dependence
* Using node-oauth lib
* The lib should be run on express/connect framework

# How to use

## Step 1: Create social factory

	var socialClient = require('social');
	// you can create "social facetory" only once, and set to your app
	var factory = socialClient({
		platform_nameA : {key: key, secret: secret},
		platform_nameB : {key: key, secret: secret}
	}, isDebugMode); // some platform debug mode using defferent api

## Step 2 Create client: in the requests with query including social parameters given by platform

	var snsInfo = factory.getAppEntryInfo( req ); // req is express/connect's request
	var client = factory.createClient( snsInfo ); // Create a client by snsInfo
	
## Step 3 Using commonAPIs: now your have the social client and you can use common apis

	client.friends_ids(null, /* you can set some API additional parameters here */
	  function(err, data){
	  // for some api data will be including user's information
	});

## Step 4 Common User Structure
To support all platform , user's social information structure will be converted to a common structure:

	{
	   id 			: String // User's ID in social platform
	 , name 		: String // User's Name in social platform
	 , imageUrl 	: String // User's image url
	 , imageUrlLarge: String // User's large image url
	 , gender		: Boolean// true is male , false is female
	 , isSpecial	: Boolean// true means VIP of the social platform
	 , specialType 	: Number // User's vip level
	}

And other special data for defferent platform will be still in the object

# How to use QQ Payment

## Step 1 Send Payment Request
start a payment request

	var client = factory.createClient( snsInfo ); // snsInfo can be stored in session, and using in each req
	client.payment_request( param // "param" refer to http://wiki.open.qq.com/wiki/v3/pay/buy_goods
	  , functino(err, data){
	  	/** importent parameter in data:
	  	 *	token:		payment token id
	  	 *	url_params: will using in frontend
	  	 */
	  });

## Step 2 FrontEnd JS Call
Using social's common client JS or QQ's fusion2.dialog.buy // refer to http://wiki.open.qq.com/wiki/fusion2.dialog.buy.
In this step, player will send payment request to QQ platform.

## Step 3 Platform Callback and onfirm payment
After step 2, QQ platform will request to your callback url
	
	// QQ's request without user's snsinfo, but query including user's openid, you can get sns info from DB
	var client = factory.createClient( "qq" ); // you also can create social client with string
	// if you can get user's sns info, pls create client by snsInfo
	client.payment_callback(req, res // express's req and res
	 , function onSuccess(callback) {
    	// this function will be called when "sig" checking succeeded
    }
    , function onFail(callback) {
    	// this function will be called when "sig" checking failed
    })
    , function onDelivery(err, data){ // Optional
    	// if you create client with sns info, this function will be called when delivery finished
    });

# CommonAPIs
* ```acccount_info``` : get current user's info
	* support: _all_
* ```friends_ids``` : get user's friends ids
	* support: _all_
* ```appfriends_ids``` : get user's app friends(installed current application) ids
	* support: _all_
* ```appfriends_info``` : get user's app friends detail info
	* support: _all_
* ```is_app_user``` : check if the user installed current application
	* support: _all_
* ```users_info``` : get user's info by ids array
	* support: _all_

# Todo
* implement Tencent logging system for qq
* implement WeiYouXi payment

# Contact me
* Weibo: http://weibo.com/boisgames
* Mail: btspoony[AT]gmail.com