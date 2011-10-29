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

  // Now middleware available
  app.use(snsclient.middleware());

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
		key: '273500697', 
		secret: 'ed5b6163e40ae7c23bb3fc6e3c262704',
	},
	wyx : {
		type: 'wyx',
		key: '4149712685',
		secret: 'c3e0afbbf0b22c1920e7d84c05721e09',
	},
	renren : {
		type: 'renren',
		key:  '08abb4597fa546349ea8e2cc2a5bdac4',
		secret: '70af0efe35064d56b6ceec62650a00ab', 
	}
}
snsclient.setDefaultAppinfo(appInfos.renren);

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
		client = snsclient.createClient(appInfos[req.snsInfo.type]);
	}else{
		client = snsclient.createClient(); // using default
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
