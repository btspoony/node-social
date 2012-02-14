# Multi-platform Social Client for Node
This is general Social Client libs for most social network platforms.

### Implemented:

* "wyx" - Sina Weiyouxi (Old style FB like, in-frame only, implemented)
* "renren" - RenRen (OAuth2, implemented)
* "qq" - QZone/Pengyou

### Not implement yet:

* "fb" - Facebook
* "google" - Google+
* "kaixin" - Kaixin001

### Implemented but not suggest to use

* "sina" - Weibo (OAuth, implemented, but lack of sns CommonAPI)

# How to use

## To create a social client
	var socialClient = require('social');
	
	var factory = socialClient({
		platform_nameA : {key: key, secret: secret},
		platform_nameB : {key: key, secret: secret}
	});
		
	var client_nouser, client_withuser;
	
	client_nouser = factory.createClient('platform_nameA'); // for no authorized_user
	
	factory.setDefault('platform_nameA'); // set a default platform
	client_nouser = factory.createClient(); // for no authorized_user and using default
	
	// set user and using default
	// you can get authorized_user by snsClient's function "authorize()"
	client_withuser = factory.createClient(authorized_user); 

## To authorize
_some authorization may be redirecting page_

	// create a default client
	var client = factory.createClient(), authorized_user;
	client.authorize(req, res, function(err, user){
		// if no err, user will be the authorized_user to be used in other CommonAPIs
		authorized_user = user;
	});
	
## Using commonAPIs
	// create a default client with authorized_user
	var client = factory.createClient(authorized_user);
	client.friends_ids(null, /* you can set some API additional parameters here */
	  function(err, data){
	  //To handle data
	});

## Dependence
* Using node-oauth lib
* The lib should be run on express framework(for session and router support)

# CommonAPIs
* ```acccount_info``` : get current user's info
	* support: _all_
* ```friends_ids``` : get user's friends ids
	* support: _all(except weibo)_
* ```appfriends_ids``` : get user's app friends(installed current application) ids
	* support: _all(except weibo)_
* ```appfriends_info``` : get user's app friends detail info
	* support: _all(except weibo)_
* ```is_app_user``` : check if the user installed current application
	* support: _all(except weibo)_
* ```users_info``` : get user's info by ids array
	* support: _all(except weibo)_

# Contact me
* Weibo: http://weibo.com/boisgames
* Mail: btspoony[AT]gmail.com