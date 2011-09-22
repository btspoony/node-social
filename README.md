# Multi-platform SNS Client for Node
This is general SNS Client libs for most SNS platforms. Including:

* Weiyouxi (Old style FB like, in-frame only, implemented)
* RenRen (OAuth2, implemented)
* Weibo (OAuth, implemented, but lack of sns CommonAPI)
* Facebook (not implement yet)
* QZone (not implement yet)
* QQ Pengyou (not implement yet)
* Google+ (not implement yet)
* orkut (not implement yet)

# Dependence
* Using node-oauth lib
* The lib should be run on express framework(for session and router support)

# How to use
//TODO (now is in development, you can look at example first)

# CommonAPIs
* ```acccount_info``` : get current user's info
	* support: _all_
* ```friends_ids``` : get user's friends ids
	* support: _all(except weibo)_ _(wenyouxi should be ok, but error occurs, I am trying to fix)_
* ```appfriends_ids``` : get user's app friends(installed current application) ids
	* support: _all(except weibo)_ _(wenyouxi should be ok, but error occurs, I am trying to fix)_
* ```appfriends_info``` : get user's app friends detail info
	* support: _all(except weibo)_ _(wenyouxi should be ok, but error occurs, I am trying to fix)_
* ```is_app_user``` : check if the user installed current application
	* support: _all(except weibo)_

# Contact me
* Weibo: http://weibo.com/boisgames
* Mail: btspoony[AT]gmail.com