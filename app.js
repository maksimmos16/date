var express = require('express');
var app = express();
/* var proto = process.env.PROTO ? process.env.PROTO : 'https';
var host = process.env.HOST ? process.env.HOST : 'easydate.aistechnolabs.in';
var port = process.env.PORT ? process.env.PORT : 831;

if (host == 'easydate.aistechnolabs.in') {
  global.baseUrl = proto+'://easydate.aistechnolabs.in/';  
} else {
  global.baseUrl = proto+'://'+host+':'+port+'/';
} */
//const config = require('./config/constants.js');
var config = require('./config/constants.js');
var port = config.port || 831;
global.baseUrl = config.baseUrl;
console.log('port:----', port);

var passport = require('passport');
var flash = require('connect-flash');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var fileStoreOptions = {};

var jwt = require('jsonwebtoken');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var dateFormat = require('dateformat');
var fileUpload = require('express-fileupload');
var expressValidator = require('express-validator');  
var nunjucks  = require('nunjucks');


// [ Google Signin ]
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var configAuth = require('./config/auth');
global.configAuth = configAuth;

// [ Database ]
global.mongoose = require('mongoose');

// [ Userful Global Varibals ]
global.dateFormat = dateFormat;

global.fs = require('fs');
global.moment = require('moment-timezone');

global.twilioMsg = require('twilio')(config.accountSid, config.authToken);


//Start : Coin Payments 
global.merchantId = config.coinMerchantId;

const CoinPayments = require('coinpayments');
let options = {
  key: config.coinKey,
  secret: config.coinSecret,
  autoIpn: true
};

global.coinPayment = new CoinPayments(options);
global.CoinPaymentsEvents = CoinPayments.events;;
//End: Coin Payments




/* if (proto == 'https' && host != 'easydate.aistechnolabs.in') {
  let httpsOptions = {
    key : fs.readFileSync('./config/'+host+'.key','utf8'),
    cert: fs.readFileSync('./config/'+host+'.crt','utf8')
  };
  var server = require('https').createServer(httpsOptions, app);
} else {
  var server = require('http').createServer(app);
} */
var server = require('http').createServer(app);

io = require('socket.io')(server);

require('./config/database.js')();

const router = require('./src/router');
const syncServiceDetails = require('./src/sync_service_details');


// Get Sync Service Details for lazy creation of default service if needed
syncServiceDetails();

// [ End ] [ Video Call Setup - App ]

app.use(expressValidator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());




// [ Temp ]
var methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.use('/api',function(req, res, next) {
  let body = req.body;
  let src = req.originalUrl;
  console.log('\x1b[1m\x1b[47m\x1b[30mAPI Call:\x1b[0m {\n \x1b[1msrc: \x1b[0m\x1b[36m',src,' \x1b[0m\x1b[1m \n body: \x1b[0m',body,' \n}\x1b[1m\x1b[35m '+new Date(),' \x1b[0m');
  next();
});

//view engine setup
app.use(express.static(path.join(__dirname, 'public')));
nunjucks.configure('app/views', {
  autoescape: true,
  express   : app,
  watch: false
});
app.set('view engine', 'html');

//set in headers in every request
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// [ Cookie ]
app.use(cookieSession({
  name: 'session',
  keys: ["atlascookie"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// [ Session ]
app.use(session({
  store: new FileStore(fileStoreOptions),
  secret: 'golfcookie',
  resave: false,
  saveUninitialized: false,  
}));

app.use(function(req,res,next){
  res.locals.session = req.session;
	next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(fileUpload());

console.log("\n|---------------------- Welcome To Easy Date ----------------------|");
console.log("Loading Models...");
var model = require('./app/models/index')(mongoose);
console.log("Loading Controllers...");
var controllers = require('./app/controllers/index')(model);
console.log("Loading Helpers...");
require('./routes/index.js')(app, model, controllers);
global.helper = require('./app/helpers/helpers.js');
global.stripeHelper = require('./app/helpers/stripeHelper.js');
global.spotifyHelper = require('./app/helpers/spotifyHelper.js');
// global.plaidHelper = require('./app/helpers/plaidHelper.js');
helper.getDefaultSetting(model);


// [ Audio Call ]
const methods = require('./src2/server.js');
const tokenGenerator = methods.tokenGenerator;
const makeCall = methods.makeCall;
const placeCall = methods.placeCall;
const incoming = methods.incoming;
const welcome = methods.welcome;

app.get('/audio', function(request, response) {
  console.log('Audio - Get',request.body);
  console.log('Audio - Get',request.params);
  response.send(welcome());
});

app.post('/audio', function(request, response) {
  console.log('Audio - Post',request.body);
  console.log('Audio - Post',request.params);
  response.send(welcome());
});

app.get('/accessToken', function(request, response) {
  console.log('accessToken - Get',request.body);
  console.log('accessToken - Get',request.params);
  tokenGenerator(request, response);
});

app.post('/accessToken', function(request, response) {
  console.log('accessToken - Post',request.body);
  console.log('accessToken - Post',request.params);
  tokenGenerator(request, response);
});

app.get('/makeCall', function(request, response) {
  console.log('makeCall - Get',request.body);
  console.log('makeCall - Get',request.params);
  makeCall(request, response);
});

app.post('/makeCall', function(request, response) {
  console.log('makeCall - Post',request.body);
  console.log('makeCall - Post',request.params);
  makeCall(request, response);
});

app.get('/placeCall', placeCall);

app.post('/placeCall', placeCall);

app.get('/incoming', function(request, response) {
  console.log('incoming - Get',request.body);
  console.log('incoming - Get',request.params);
  response.send(incoming());
});

app.post('/incoming', function(request, response) {
  console.log('incoming - Post',request.body);
  console.log('incoming - Post',request.params);
  response.send(incoming());
});

// [ Audio Call -- ]

//[ Google ]
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect : '/googleLogin',
    failureRedirect : '/'
  }),
  function(req, res) {
    console.log('/auth/google/callback------------->>>>>req.session.passport.user: ',req.session.passport.user);
    let userId = req.session.passport.user;      
    res.redirect('/');
  }
);

app.get('/googleLogin', function(req, res) {
  console.log('/googleLogin----------->>>>>req.session.passport: ',req.session.passport);
  let userId = req.session.passport ? req.session.passport.user : null;
  model.User.findOne({_id:userId}, function(err, userDetails) {

    if (userDetails) {
      let userData = {
        userId      : userDetails._id,
        loginToken  : userDetails.loginToken,
        phno        : userDetails.phno,
        email       : userDetails.email,
        firstName   : userDetails.firstName,
        lastName    : userDetails.lastName,
        countryCode : userDetails.countryCode,
        loginType   : userDetails.loginType,
        deviceType  : userDetails.deviceType,
        username    : userDetails.username,
        profilePic  : userDetails.profilePic,
        isLogin     : true
      }
      req.session.userData = userData;
      req.headers.token = userDetails.loginToken;
      console.log('/googleLogin--------------->>>>"user found" userData: ',req.session.userData);
      if (userDetails.isFirstTime) {
        res.redirect('/basicDetail');
      } else {
        res.redirect('/home');
      }
    } else {
      console.log('/googleLogin--------------->>>>"user not found"');
      res.redirect('/');
    }
  });
});

passport.serializeUser(async function(user, done) {
  // console.log('serializeUser-------------->>>user: ',user);
  done(null, user.id);
});
passport.deserializeUser(async function(id, done) {
  // console.log('\ndeserializeUser-------------->>>id: ',id);
  model.User.findOne({ '_id' : id }, function(err, usr) {
    done(err, usr);
  });
});
passport.use(new GoogleStrategy({

  clientID        : configAuth.googleAuth.clientID,
  clientSecret    : configAuth.googleAuth.clientSecret,
  callbackURL     : configAuth.googleAuth.callbackURL,

}, function(token, refreshToken, profile, done) {
  
  console.log('GoogleStrategy------1111------>>>>token: ',token,' refreshToken: ',refreshToken);  
  
  // make the code asynchronous
  // User.findOne won't fire until we have all our data back from Google
  process.nextTick(async function() {

    // try to find the user based on their google id
    console.log('GoogleStrategy------222-------->>>>>>profile.id: ',profile.id);
    let usr = await model.User.findOne({ 'socialId' : profile.id, isDeleted: false });
    if(usr){
      let loginToken = jwt.sign({ data: usr._id }, config.jwt_secret, { expiresIn: config.jwt_expire });
      // if a user is found, log them in
      console.log('GoogleStrategy-------333-------->>>>"Found"');
      let upData = {
        updatedAt: new Date(),
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        isLogin: true,
        loginToken: loginToken
      };
      let userDetail = await model.User.findOneAndUpdate({_id:usr._id},upData,{new: true});
      console.log('GoogleStrategy--------->>>>userDetail: ',userDetail);
      return done(null, userDetail);
    } else{
      // if the user isnt in our database, create a new user
      let verified = (profile.emails[0].verified == true) ? true : false;
      let location = {
        type: 'Point',
        coordinates: [0,0]
      };
      let us = await model.User.create({
        'firstName': profile.name.givenName,
        'lastName': profile.name.familyName,
        'email': profile.emails[0].value,
        'isVerified': verified,
        'googleToken': token,
        'loginToken':'',
        'socialId': profile.id,
        'deviceType': 'web',
        'loginType': 'gmail',
        'isLogin': true,
        'role': 'user',
        'profilePic':'upload/photos/defaultUser.png',
        'location': location
      });
      let loginToken = jwt.sign({ data: us._id }, config.jwt_secret, { expiresIn: config.jwt_expire });
      let userData = await model.User.findOneAndUpdate({_id: us._id}, {loginToken:loginToken, updatedAt: new Date()},{new: true});
      if (userData) {

        console.log('GoogleStrategy----444----->>>>"create" userData: ',userData);
        return done(null, userData);
      } else {
        console.log('GoogleStrategy----555----->>>>"create" false: ');
        return done(null, false);
      }
    }
  });
}));


app.get('/callback2', function(req, res){
  console.log('callback2 - get: ',req.body);
  console.log('callback2 - get: ',req.params);
  console.log('callback2 - get: ',req.query);
  res.send('ok');
});

app.post('/callback', function(req, res){
  console.log('callback2 - post: ',req.body);
  console.log('callback2 - post: ',req.params);
  console.log('callback2 - post: ',req.query);
  res.send('ok');
});

app.post('/api/token', function(req, res){
  console.log('callback3 - post: ',req.body);
  console.log('callback3 - post: ',req.params);
  console.log('callback3 - get: ',req.query);


  console.log('callback3 - post -from api: ',req.body);
  console.log('callback3 - post -from api: ',req.params);
  console.log('callback3 - get  -from api: ',req.query);
  res.redirect('/home');
});
/* app.set('port', port);
server.listen(port, function(){
  console.log("(---------------------------------------------------------------)");
  console.log(" |                    Server Started...                        |");
  console.log(" |                  "+baseUrl+"          |");
  console.log("(---------------------------------------------------------------)");
}); */

//Start: Server connection
app.set('port', port);
server.listen(port, function () {
  console.log("server starting on port " + port);
  console.log("(---------------------------------)");
  console.log("|         Server Started...       |");
  console.log("|      " + config.baseUrl + "     |");
  console.log("(---------------------------------)");
});
//End: Server connection

// [ Socket ]
var socket_count=0;
io.on('connection', function(client){
  console.log("Socket Connection Established: ",client.id);
  socket_count++;
  io.emit('count',socket_count);
  require('./socket/index')(model, io, client);
  
  client.on('disconnect', function(){ 
    socket_count--;
    io.emit('count',socket_count);
    console.log("Socket Disconnected") ;
  });

});

require('./config/error.js')(app);
module.exports = {app:app, server:server}