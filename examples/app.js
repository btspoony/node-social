/**
 * Module dependencies.
 */
var express = require('express');

var app = module.exports = express.createServer();

var port = process.env.PORT || 3000;

// require snsclient and set sns app info
var clientFactory = require('../')({
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
});
clientFactory.setDefault("renren");

// Configuration
app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
	app.use(express.session({ 
		secret: 'sns-client_2hhxSfs2fh0asa'
	}));
  app.use(express.methodOverride());

  // Now middleware available
  app.use(require('../').middleware(clientFactory));

  app.use(app.router);
});	

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

/**
 * Query middleware
 */
function queryCheck(req, res, next){
	var user = req.session.authorized_data;
	if(user && (!user.expire || user.expire > (new Date()).getTime() )){
		next('route');
	}else{
		next();
	}	
};

app.get('/', queryCheck, function(req, res, next){
	var session = req.session,
		client;
	
	if(req.snsInfo){
		client = clientFactory.createClient(req.snsInfo.platform);
	}else{
		client = clientFactory.createClient(); // using default
	}
	client.authorize(req, res, function(err, user){
		if(err) next(new Error(JSON.stringify(err) ));
		else{
			req.session.authorized_data = user;
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
	var user = req.session.authorized_data;
	var	client = clientFactory.createClient(user.platform, user);
	
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
