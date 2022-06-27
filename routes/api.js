var request = require('request');
const { check, validationResult } = require('express-validator');
module.exports = function (app, model, controller) { 
    var middleware = require('../app/middleware/index')(model);
    var validation = require('../app/validator/index')(model);
    
    app.get('/test',function(req,res){
        res.render('test');
    });

    // [ User Auth ]
    app.get('/api/auth/emailLogin/:id', controller.auth.emailLogin);
    app.post('/api/auth/login', validation.api.login, controller.auth.login);
    app.post('/api/auth/verifyOTP', controller.auth.verifyOTP);
    app.post('/api/auth/resendOTP', controller.auth.resendOTP);
    app.post('/api/auth/logout',middleware.api.login, controller.auth.logout);
    

    // [ profile ]
    app.post('/api/profile/viewProfile', middleware.api.login, controller.profile.viewProfile);
    app.post('/api/profile/emailChecker', middleware.api.login, controller.profile.emailChecker);
    app.post('/api/profile/editProfile', middleware.api.login, controller.profile.editProfile);
    app.post('/api/profile/getProfileFields', middleware.api.login, controller.profile.getProfileFields);
    app.post('/api/profile/emailCheckPost', middleware.api.login, controller.profile.emailCheckPost);
    app.post('/api/profile/getStates', middleware.api.login, controller.profile.getStates);
    app.post('/api/profile/getCities', middleware.api.login, controller.profile.getCities);
    app.post('/api/profile/uploadMedia', middleware.api.login, validation.api.uploadMedia, controller.profile.uploadMedia);
    app.post('/api/profile/deleteMedia', middleware.api.login, validation.api.deleteMedia, controller.profile.deleteMedia);
    app.post('/api/profile/sortMedia', middleware.api.login, validation.api.sortMedia, controller.profile.sortMedia);
    app.post('/api/profile/commentPhoto', middleware.api.login, validation.api.commentPhoto, controller.profile.commentPhoto);
    app.post('/api/profile/getTestimonials', middleware.api.login, validation.api.getTestimonials, controller.profile.getTestimonials);
    app.post('/api/profile/setPrivacyMode', middleware.api.login, controller.profile.setPrivacyMode);

    // [ questions ]
    app.post('/api/userAnswer/getQuestion', middleware.api.login, controller.userAnswer.getQuestion);
    app.post('/api/userAnswer/addAnswer', middleware.api.login,validation.api.addAnswer ,controller.userAnswer.addAnswer);
    app.post('/api/userAnswer/viewAnswerList', middleware.api.login, controller.userAnswer.viewAnswerList);
    app.post('/api/userAnswer/viewAnswer', middleware.api.login, validation.api.viewAnswer, controller.userAnswer.viewAnswer);
    app.post('/api/userAnswer/getMatchQues', middleware.api.login, controller.userAnswer.getMatchQues);
    app.post('/api/userAnswer/getHighestPerc', middleware.api.login, controller.userAnswer.getHighestPerc);
    app.post('/api/userAnswer/compareAnswer', middleware.api.login, validation.api.compareAnswer, controller.userAnswer.compareAnswer);

    // [ feedback ]
    app.post('/api/feedback/getFeedbackQuestions', middleware.api.login, controller.feedback.getFeedbackQuestions);
    app.post('/api/feedback/sendFeedback', middleware.api.login,validation.api.sendFeedback,  controller.feedback.sendFeedback);

    // [ notification ]
    app.post('/api/notification/getNotificationsSettings', middleware.api.login, controller.notification.getNotificationsSettings);
    app.post('/api/notification/setNotifications', middleware.api.login, controller.notification.setNotifications);
    app.post('/api/notification/setNotificationsApp', middleware.api.login, controller.notification.setNotificationsApp);
    app.post('/api/notification/getNotification', middleware.api.login, controller.notification.getNotification);

    // [ Payments ]
    app.post('/api/payment/getSubscription', controller.payment.getSubscription);
    app.post('/api/payment/activateSubscription', middleware.api.login, validation.api.activateSubscription, controller.payment.activateSubscription);
    app.post('/api/payment/getUserSubscription', middleware.api.login, controller.payment.getUserSubscription);
    app.post('/api/payment/cancelSubscription', middleware.api.login, validation.api.cancelSubscription, controller.payment.cancelSubscription);
    app.post('/api/payment/coinResponse', controller.payment.coinResponse);    
    app.post('/api/payment/getPaymentDetails', middleware.api.login, controller.payment.getPaymentDetails);    

    // [ Contact Us ]
    app.post('/api/user/contact', middleware.api.login, controller.auth.contact);
    app.post('/api/user/delete',middleware.api.login, controller.auth.deleteUser);
    // [ You Like Another ]
    app.post('/api/user/like',middleware.api.login ,controller.like.like);

    // [ You Dislike Another ]
    app.post('/api/user/dislike',middleware.api.login ,controller.like.dislike);

    app.post('/api/like/getFlavaLikes',middleware.api.login, controller.like.getFlavaLikes);
    
    // [ Flava routes ]
    app.post('/api/flava/exploreFlava',middleware.api.login, controller.flava.exploreFlava);
    app.post('/api/flava/discoverFlava',middleware.api.login, controller.flava.discoverFlava);
    app.post('/api/flava/viewFlava', middleware.api.login, validation.api.viewFlava, controller.flava.viewFlava);
    app.get('/api/flava/trustScoreBoard', controller.flava.trustScoreBoard);
    app.post('/api/flava/unmatch', middleware.api.login, validation.api.unmatch, controller.flava.unmatch);
    app.post('/api/flava/block', middleware.api.login, validation.api.block, controller.flava.block);
    app.post('/api/flava/report', middleware.api.login, validation.api.report, controller.flava.report);
    
    // [ Date ]
    app.get('/api/date/getDateRef', controller.date.getDateRef); 
    app.post('/api/date/bookDate', middleware.api.login, validation.api.bookDate, controller.date.bookDate);
    app.post('/api/date/viewDate', middleware.api.login, validation.api.viewDate, controller.date.viewDate); 
    app.post('/api/date/approveDate', middleware.api.login, validation.api.approveDate, controller.date.approveDate);
    app.post('/api/date/updateDate', middleware.api.login, validation.api.updateDate, controller.date.updateDate);
    app.post('/api/date/dateHistory', middleware.api.login, controller.date.dateHistory);


    // [ Instagram ]
    app.get('/instaCallback', controller.instagram.authResp);
    app.post('/api/instagram/updateTokenId',middleware.api.login, validation.api.updateInstaTokenId, controller.instagram.updateInstaTokenId);
    app.post('/api/instagram/getAllInstaFeeds',middleware.api.login, controller.instagram.getAllInstaFeeds);
    app.post('/api/instagram/getUserInstaFeeds',middleware.api.login, validation.api.getUserInstaFeeds, controller.instagram.getUserInstaFeeds);

    // [ Spotify ]
    app.post('/api/spotify/getSongs',middleware.api.login, controller.instagram.getSongs);   
    app.post('/api/spotify/selectSong', middleware.api.login, controller.instagram.selectSong);
    
    // [ Twilio Video Callback]
    // app.post('/api/videoChat/makeVideoCall', middleware.api.login, validation.api.makeVideoCall ,controller.videoChat.makeVideoCall);
    // app.post('/api/videoChat/receiveCall', middleware.api.login, validation.api.receiveCall ,controller.videoChat.receiveCall);
    // app.post('/api/videoChat/endCall', middleware.api.login, validation.api.endCall ,controller.videoChat.endCall);

    // app.post('/api/videoStatusCallback',controller.videoChat.videoStatusCallback);

    // // [ App - Tst ]
    // app.post('/api/audioCall/accessToken', middleware.api.login, controller.videoChat.makeVideoCallApp);
    // app.post('/api/audioCall/makeCall', controller.videoChat.makeCallAppAudio);





    app.post('/api/videoChat/makeVideoCall', middleware.api.login, controller.videoChat.makeVideoCall);
   // app.post('/api/videoChat/makeVideoCall32', middleware.api.login, controller.videoChat.makeVideoCall32);
    app.post('/api/videoChat/receiveCall', middleware.api.login, validation.api.receiveCall ,controller.videoChat.receiveCall);
    app.post('/api/videoChat/endCall', middleware.api.login, validation.api.endCall ,controller.videoChat.endCall);

    app.post('/api/videoStatusCallback',controller.videoChat.videoStatusCallback);

    // [ App - Tst ]
    app.post('/api/audioCall/accessToken', middleware.api.login, controller.videoChat.makeVideoCallApp);
    app.post('/api/audioCall/makeCall', controller.videoChat.makeCallAppAudio);
    app.get('/api/cms/:id',controller.cms.getCmsPage);

    // [ Chat ]
    app.post('/api/chat/sendChatMessage', middleware.api.login, controller.chat.sendChatMessage);
    app.post('/api/chat/getChatUserList', middleware.api.login, controller.chat.getChatUserList);
    app.post('/api/chat/getMessages', middleware.api.login, validation.api.getMessages, controller.chat.getMessages);
    app.post('/api/chat/uploadMedia', middleware.api.login, validation.api.uploadChatMedia, controller.chat.uploadChatMedia);
    app.post('/api/chat/chatScreenOn', middleware.api.login, controller.chat.chatScreenOn);
}
