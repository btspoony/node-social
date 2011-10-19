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
		type: 'sina',
		key: '{your sina key}',
		secret: '{your sina secret}',
	},
	wyx : {
		type: 'wyx',
		key: '{your wyx key}',
		secret: '{your wyx secret}',
	},
	renren : {
		type: 'renren',
		key: '{your renren key}',
		secret: '{your renren secret}',
	}
}
snsclient.setDefaultAppinfo(appInfos.sina);

/**
 * Query middleware
 */
function queryCheck(req, res, next){
	var user = req.session.authorized_user;
	if(user && (!user.expire || user.expire > (new Date()).getTime() )){
		next('route');
	}else{
		// try check platform
		var info = snsclient.getInfoFromQuery(req.query);
		if(info.type){
			req.session.queryinfo = info;
		}
		next();
	}	
};

app.get('/', queryCheck, function(req, res, next){
	var session = req.session,
		client;
		
	var queryinfo = session.queryinfo;
	if(queryinfo){
		client = snsclient.createClient(appInfos[queryinfo.type]);
	}else{
		client = snsclient.createClient(); // using default
	}
	client.authorize(req, res, function(err, user){
		if(err) next(new Error(JSON.stringify(err) ));
		else{
			req.session.authorized_user = user;
			next();	
		}
	});
});

/**
 * Account Check middleware
 */
function dataCheck(req, res, next){
	if(req.session.userdata) next('route');
	else next();
};
app.get('/', dataCheck, function(req, res, next){
	var user = req.session.authorized_user;
	var type = user.platform;
	var	client = snsclient.createClient(appInfos[type], user);
	
	client.friends_ids(null, function(err, data){
		if(err) next(new Error(JSON.stringify(err) ));
		else{
			req.session.userdata = data;
			next();	
		}
	});
});

app.get('/', function(req, res){
	var txt = 'SNS Client! <br /><br /><br />'+ JSON.stringify(req.session.userdata);
	
	res.send(txt);
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
