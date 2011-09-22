/**
 * Module dependencies.
 */
var express = require('express'),
	snsclient = require('../');

var app = module.exports = express.createServer();

var port = process.env.PORT || 3000;
// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
	app.use(express.session({ 
		secret: 'sns-client_2hhxSfs2fh0asa'
	}));
  app.use(express.methodOverride());
  app.use(app.router);
});	

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

//set sns app info
var appInfos = {
	sina:{
		key: '{your sina key}',
		secret: '{your sina secret}',
	},
	wyx : {
		key: '{your wyx key}',
		secret: '{your wyx secret}',
	},
	renren : {
		key: '{your renren key}',
		secret: '{your renren secret}',
	}
}
snsclient.setDefaultAppinfo(appInfos.sina);

/**
 * Query Authorize middleware
 */
function queryAuth(req, res, next){
	if(req.session.authorized_user) return next();
	
	// try check platform
	var type = snsclient.getTypeByQuery(req.query);
	if(type != ""){
		client = snsclient.createClient(type, appInfos[type]);
	}else{
		client = snsclient.createClient(type); // using default
	}
	client.authorize(req, res, function(err){
		if(err) next(new Error(JSON.stringify(err) ));
		else next();
	});
}

app.get('/', queryAuth, function(req, res){
	var session = req.session,
		now = new Date(),
		client;
	// Render IndexPage Function
	function renderPage (error, data) {
		if(!req.session.userdata) req.session.userdata = data;
		var txt = 'SNS Client! <br /><br /><br />'+ JSON.stringify(req.session.userdata);
		if(error)	{
			console.log(error);
			txt = JSON.stringify(error);
		}
		
		res.send(txt);
	}
	
	var user = session.authorized_user;
	if (user && ( !user.expire || user.expire > now) ) {
		var type = user.platform;
		if(!session.userdata){
			var client = snsclient.createClient(type,appInfos[type], user);
			client.friends_ids(null, renderPage);
		}else{
			renderPage();
		}
	}else{
		renderPage("no user");
	}
	
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
