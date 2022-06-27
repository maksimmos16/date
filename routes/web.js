const { check, validationResult } = require('express-validator');
const config = require('../config/constants.js');
var passport = require('passport');
module.exports = function (app, model, controller) { 
    var middleware = require('../app/middleware/index')(model);
    var validation = require('../app/validator/index')(model);

    // [ Login ]
    app.get('/', middleware.web.loginCheck);
    app.get('/login', controller.auth.login);
    app.get('/mobileLogin', controller.auth.mobileLogin);
    app.get('/emailLogin', controller.auth.emailLogin);

    // [ Home ]
    app.get('/home', middleware.web.login, controller.webPages.home);

    // [ Verify ]
    app.get('/mobileOtp', controller.auth.mobileOtp);
    
    // [ Store User Data in Session ]
    app.post('/createSession', controller.auth.createSession);

    // [ After Login Pages ]
    app.get('/basicDetail', controller.auth.basicDetail);
    app.get('/additionalInfo', controller.auth.additionalInfo);
    app.get('/queNans', controller.auth.getQuestion);
    app.get('/matchQues', controller.auth.getMatchQues);
    app.get('/matchDetail/:id', controller.auth.getMatchDetail);
    
    // [ Profile Setting ]
    app.get('/profileSetting', middleware.web.login, controller.webPages.profileSetting);
    
    // [ Discover ]
    app.get('/discover', middleware.web.login, controller.webPages.discover);

    // [ Chat ]
    app.get('/chat', middleware.web.login, controller.webPages.chat);

    // [ Flava Likes ]
    app.get('/flavaLikes', middleware.web.login, controller.webPages.flavaLikes);

    // [ Book Date ]
    app.get('/bookDate/:id', middleware.web.login, controller.webPages.bookDate);

    // [ CMS Pages ]
    app.get('/cmspages', middleware.web.login, controller.webPages.cmspages);
    
    // [ Other App ]
    app.get('/otherApp', middleware.web.login, controller.webPages.otherApp)

    // [ Detail Page ]
    app.get('/user/:id/:flag', middleware.web.login, controller.webPages.userInfo);

    // [ Feedback ]
    app.get('/feedback/:id/:recId', middleware.web.login, controller.webPages.feedback);

    // [ Active Plan ]
    app.get('/activePlan/:planId/:userId', middleware.web.login, controller.webPages.activePlan);

    // [ Date History ]
    app.get('/dateHistory', middleware.web.login, controller.webPages.dateHistory);

    // [ Amenties ]
    app.post('/getAmenities', controller.webPages.getAmenities);
    app.post('/getMessages', controller.webPages.getMessages);

    // [ Spotify ]
    app.get('/spotify', controller.webPages.spotify);
    app.get('/spotifyCallback', controller.webPages.spotifyCallback);
    app.post('/spotifyCallback', function(req, res){
        console.log('spotifyCallback-----post---->>>req.query: ',req.query);
        console.log('spotfyCallback-------post----->>>>req.body: ',req.body);
        console.log('spotifyCallback------post--->>>req.params: ',req.params);
    });
    app.post('/spotify/search', controller.webPages.spotifySearch);
    app.post('/spotify/selectSong', controller.webPages.spotifySelectSong);

    app.get('/playlists', controller.webPages.playlists);
    app.get('/test32', function(req, res){
        res.render('web/test');
    });

    app.get('/payment/:id',middleware.web.login ,controller.webPages.payment);
    app.get('/datePayment/:id', controller.webPages.datePayment);
    app.post('/sendCardDetails', /*validation.web.sendCardDetails,*/ controller.webPages.sendCardDetails);
    app.get('/checkout/:transId', controller.webPages.checkout);
    app.post('/sendBankDetails', validation.web.sendBankDetails, controller.webPages.sendBankDetails);

    app.get('/login/snapchat/callback',
      function(req, res) {
        console.log('snapchat----------->>>req.query: ',req.query);
        res.redirect('/');
    });
}