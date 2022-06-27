const { check, validationResult } = require('express-validator');
module.exports = function (app, model, controller) {
    
    var middleware = require('../app/middleware/index')(model);
    var validation = require('../app/validator/index')(model);

    // [ Admin Authentication ]
    app.get('/admin', middleware.admin.isLogin, controller.auth.login);
    
    app.post('/login/check', validation.admin.login, controller.auth.loginCheck);
    app.get('/forget', controller.auth.forget);
    app.get('/reset', middleware.admin.isLogin, controller.auth.resetPassword);
    app.post('/resetPassword', middleware.admin.isLogin, controller.auth.resetPasswordPost);
    app.post('/login/forgetpassword', controller.auth.forgetPassword);
    app.get('/admin/logout', middleware.admin.login, controller.auth.logout);

    // [ Admin ]
    app.get('/admin/dashboard', middleware.admin.login, controller.dashboard.view);
    app.get('/admin/profile', middleware.admin.login, controller.auth.viewProfile);
    app.post('/admin/profileUpdate/',middleware.admin.login, validation.admin.profile, controller.auth.updateProfileDetail);

    // [ Site Setting ]
    app.get('/admin/setting', middleware.admin.login, controller.setting.viewSetting);
    app.put('/admin/settingUpdate',middleware.admin.login, validation.admin.updateSettingDetail, controller.setting.updateSettingDetail);    

    // [ User Management ]
    app.get('/admin/user', middleware.admin.login, controller.user.view);
    app.post('/admin/userList', middleware.admin.login, controller.user.userList);
    app.get('/admin/user/view/:id', middleware.admin.login, controller.user.viewProfile);
    // app.post('/admin/userUpdate/',middleware.admin.login, validation.admin.profile, controller.auth.updateProfileDetail);
    app.get('/admin/user/delete/:id',middleware.admin.login, controller.user.deleteUser);

    // [ View User's Right Swipe ]
    app.get('/admin/user/viewRightSwipe/:id', middleware.admin.login, controller.user.viewRightSwipe);

    // [ View Document ]
    app.get('/admin/user/viewDocument/:id', middleware.admin.login, controller.user.viewDocument);
    app.get('/admin/user/docVerify/:id', middleware.admin.login, controller.user.docVerify);

    // [ Vehicle ]
    // app.get('/admin/vehicle', middleware.admin.login, controller.vehicle.view);

    // [ Vehicle Field ]
    app.get('/admin/vehicleFieldSetup', middleware.admin.login, controller.vehicleFieldSetup.view);
    app.post('/admin/vehicleFieldSetupList', middleware.admin.login, controller.vehicleFieldSetup.vehicleFieldSetupList);
    app.get('/admin/vehicleFieldSetup/add', middleware.admin.login, controller.vehicleFieldSetup.add);
    app.post('/admin/vehicleFieldSetup/addfield', middleware.admin.login, controller.vehicleFieldSetup.addvehicleFieldSetup);
    app.get('/admin/vehicleFieldSetup/delete/:id', middleware.admin.login, controller.vehicleFieldSetup.deletePage);  
    app.get('/admin/vehicleFieldSetup/edit/:id', middleware.admin.login, controller.vehicleFieldSetup.editPageDetail);
    app.post('/admin/vehicleFieldSetup/edit/:id',middleware.admin.login, controller.vehicleFieldSetup.updatePageDetail);
   
    // [ question Pages ]
    app.get('/admin/questions', middleware.admin.login, controller.questions.view);
    app.post('/admin/questionList', middleware.admin.login, controller.questions.questionList);
    app.get('/admin/questions/add', middleware.admin.login, controller.questions.add);
    app.post('/admin/questions/addPage', middleware.admin.login, validation.admin.questionsPagesDetail, controller.questions.addQuestion);
    app.get('/admin/questions/delete/:id', middleware.admin.login, controller.questions.deleteQuestion);  
    app.get('/admin/questions/edit/:id', middleware.admin.login, controller.questions.editQuestion);
    app.post('/admin/questions/edit/:id',middleware.admin.login, validation.admin.questionsPagesDetail, controller.questions.updateQuestionDetail);
    app.get('/admin/questions/active/:id', middleware.admin.login, controller.questions.active);

    // [ Amenties ]
    app.get('/admin/amenties', middleware.admin.login, controller.amenties.view);
    app.post('/admin/amentiesList', middleware.admin.login, controller.amenties.amentiesList);
    app.get('/admin/amenties/add', middleware.admin.login, controller.amenties.add);
    app.post('/admin/amenties/addAmenties', middleware.admin.login, controller.amenties.addAmenties);
    app.get('/admin/amenties/edit/:id', middleware.admin.login, controller.amenties.edit);
    app.post('/admin/amenties/edit/:id',middleware.admin.login, controller.amenties.editAmenties);
    app.get('/admin/amenties/delete/:id', middleware.admin.login, controller.amenties.deleteAmenties);
    // [ Location]
    app.get('/admin/location', middleware.admin.login, middleware.admin.login, controller.location.list);
    app.post('/admin/location/getListData', middleware.admin.login, controller.location.getListData);
    app.get('/admin/location/add', middleware.admin.login, controller.location.add);
    app.post('/admin/location/save', middleware.admin.login, controller.location.save);
    app.get('/admin/location/edit/:id', middleware.admin.login, controller.location.edit);
    app.post('/admin/location/update/:id', middleware.admin.login, controller.location.update);
    app.get('/admin/location/delete/:id',middleware.admin.login, controller.location.delete);

    // [ Offer ]
    app.get('/admin/offer', middleware.admin.login, controller.offer.view);
    app.post('/admin/offerList', middleware.admin.login, controller.offer.offerList);
    app.get('/admin/offer/add', middleware.admin.login, controller.offer.add);
    app.post('/admin/offer/addOffer', middleware.admin.login, validation.admin.offerPagesDetail, controller.offer.addOffer);
    app.get('/admin/offer/edit/:id', middleware.admin.login, controller.offer.edit);
    app.post('/admin/offer/edit/:id',middleware.admin.login, validation.admin.offerPagesDetail, controller.offer.editOffer);
    app.get('/admin/offer/delete/:id', middleware.admin.login, controller.offer.deleteOffer);
    app.get('/admin/offer/active/:id', middleware.admin.login, controller.offer.active);

    // [ Request  ]
    app.get('/admin/request', middleware.admin.login, controller.request.view);
    app.post('/admin/requestList', middleware.admin.login, controller.request.matchRequestList);
    app.post('/admin/request/unmatch/:id', middleware.admin.login, controller.request.changeMatchRequest);
    app.get('/admin/request/edit/:id', middleware.admin.login, controller.request.editMatchRequest);
    
 
    // [ Request Unmatch  ]
    app.get('/admin/reqUnmatch', middleware.admin.login, controller.reqUnmatch.view);
    app.post('/admin/reqUnmatchList', middleware.admin.login, controller.reqUnmatch.unmatchRequestList);
    app.get('/admin/reqUnmatch/edit/:id', middleware.admin.login, controller.reqUnmatch.changeUnmatchRequest);

    // [ comment  ]
    app.get('/admin/comment/add', middleware.admin.login, controller.comment.add);

    app.get('/admin/comment', middleware.admin.login, controller.comment.view);
    app.post('/admin/commentList', middleware.admin.login, controller.comment.commentList);
    app.get('/admin/comment/edit/:id', middleware.admin.login, controller.comment.edit);
    app.get('/admin/comment/delete/:id', middleware.admin.login, controller.comment.deleteComment);
    
    // [ leaderBoard  ]
    app.get('/admin/leaderBoard', middleware.admin.login, controller.leaderBoard.view);
    app.post('/admin/leaderBoardList', middleware.admin.login, controller.leaderBoard.leaderBoardList);
    app.get('/admin/leaderBoard/edit/:id', middleware.admin.login, controller.leaderBoard.edit);
    app.get('/admin/leaderBoard/mailSend/:id', middleware.admin.login, controller.leaderBoard.mailSendLeaderBoard);

    // [ userSubscription  ]
    app.get('/admin/userSubscription', middleware.admin.login, controller.userSubscription.view);
    app.post('/admin/userSubscriptionList', middleware.admin.login, controller.userSubscription.userSubscriptionList);
    app.get('/admin/userSubscription/edit/:id', middleware.admin.login, controller.userSubscription.edit);
    app.get('/admin/userSubscription/delete/:id', middleware.admin.login, controller.userSubscription.deleteUserSubscription);

    // [ CMS Pages ]
    app.get('/admin/cmsPages', middleware.admin.login, controller.cmsPages.view);
    app.post('/admin/cmsList', middleware.admin.login, controller.cmsPages.cmsList);
    app.get('/admin/cmsPages/add', middleware.admin.login, controller.cmsPages.add);
    app.post('/admin/cmsPages/addPage', middleware.admin.login, validation.admin.cmsPagesDetail, controller.cmsPages.addPage);
    app.get('/admin/cmsPages/delete/:id', middleware.admin.login, controller.cmsPages.deletePage);
    app.get('/admin/cmsPages/edit/:id', middleware.admin.login, controller.cmsPages.editPageDetail);
    app.post('/admin/cmsPages/edit/:id',middleware.admin.login, validation.admin.cmsPagesDetail, controller.cmsPages.updatePageDetail);

    // [ Admin Notification ]
    app.get('/admin/notification', middleware.admin.login, controller.notification.view);
    app.post('/admin/notifyList', middleware.admin.login, controller.notification.notifyList);
    app.get('/admin/notification/add', middleware.admin.login, controller.notification.add);
    app.post('/admin/notification/addNotify', middleware.admin.login, validation.admin.notification, controller.notification.addNotify);
    app.get('/admin/notification/delete/:id', middleware.admin.login, controller.notification.deleteNotify);
    app.get('/admin/notification/statusNotify/:id', middleware.admin.login, controller.notification.statusNotify);
    app.get('/admin/notification/defStatus/:id', middleware.admin.login, controller.notification.defStatus);
    app.get('/admin/notification/edit/:id', middleware.admin.login, controller.notification.editNotify);
    app.post('/admin/notification/edit/:id',middleware.admin.login, validation.admin.notification, controller.notification.updateNotify);

    // [ User Image  ]
    app.get('/admin/userImage', middleware.admin.login, controller.userImage.view);
    app.post('/admin/userImageList', middleware.admin.login, controller.userImage.userImageList);
    app.post('/admin/userImage/delete/:id', middleware.admin.login, controller.userImage.deleteUserImage);
    app.get('/admin/userImage/edit/:id', middleware.admin.login, controller.userImage.editUserImage);
    app.post('/admin/userImage/edit/:id',middleware.admin.login, controller.userImage.updateUserImage);

    // [ Transaction ]
    app.get('/admin/transaction', middleware.admin.login, controller.transaction.view);
    app.post('/admin/transaction/getTransactionList', middleware.admin.login, controller.transaction.getTransactionList);
    app.get('/admin/transaction/view/:id', middleware.admin.login, controller.transaction.viewDetails);
 
    // [ Language ]
    app.get('/admin/lang', middleware.admin.login, controller.language.lang);
    app.get('/admin/addKeyword', middleware.admin.login, controller.language.addKeyword);
    app.post('/admin/langSave',middleware.admin.login, controller.language.langSave);
    app.get('/admin/langEdit/:id', middleware.admin.login, controller.language.langEdit);
    app.post('/admin/keywordUpdate/:id',middleware.admin.login, controller.language.updateKeyword);
    app.get('/admin/langKeyDelete/:id', middleware.admin.login, controller.language.langKeyDelete); 

    // [ Country ]
    app.get('/admin/country', middleware.admin.login, controller.country.view);
    app.post('/admin/countryList', middleware.admin.login, controller.country.countryList);
    app.get('/admin/country/add', middleware.admin.login, controller.country.add);
    app.post('/admin/country/addCountry', middleware.admin.login, controller.country.addCountry);
    app.get('/admin/country/delete/:id', middleware.admin.login, controller.country.delete);  
    app.get('/admin/country/edit/:id', middleware.admin.login, controller.country.editCountry);
    app.post('/admin/country/edit/:id',middleware.admin.login, controller.country.updateCountry);

    // [ State ]
    app.get('/admin/state', middleware.admin.login, controller.state.view);
    app.post('/admin/stateList', middleware.admin.login, controller.state.stateList);
    app.get('/admin/state/add', middleware.admin.login, controller.state.add);
    app.post('/admin/state/addState', middleware.admin.login, controller.state.addState);
    app.get('/admin/state/delete/:id', middleware.admin.login, controller.state.delete);
    app.get('/admin/state/edit/:id', middleware.admin.login, controller.state.editState);
    app.post('/admin/state/edit/:id',middleware.admin.login, controller.state.updateState);

    // [ City ]
    app.get('/admin/city', middleware.admin.login, controller.city.view);
    app.post('/admin/cityList', middleware.admin.login, controller.city.cityList);
    app.get('/admin/city/add', middleware.admin.login, controller.city.add);
    app.post('/admin/city/addCity', middleware.admin.login, controller.city.addCity);
    app.post('/admin/getStates',middleware.admin.login, controller.city.getStates);
    app.get('/admin/city/delete/:id', middleware.admin.login, controller.city.delete);
    app.get('/admin/city/edit/:id', middleware.admin.login, controller.city.editCity);
    app.post('/admin/city/edit/:id',middleware.admin.login, controller.city.updateCity);

    // [ Institute ]
    app.get('/admin/institute', middleware.admin.login, controller.institute.view);
    app.post('/admin/instituteList', middleware.admin.login, controller.institute.instituteList);
    app.get('/admin/institute/add', middleware.admin.login, controller.institute.add);
    app.post('/admin/institute/addInstitute', middleware.admin.login, controller.institute.addInstitute);
    app.get('/admin/institute/delete/:id', middleware.admin.login, controller.institute.delete);
    app.get('/admin/institute/edit/:id', middleware.admin.login, controller.institute.editInstitute);
    app.post('/admin/institute/edit/:id',middleware.admin.login, controller.institute.updateInstitute);

    // [ Profile Fields ]
    app.get('/admin/profileFields', middleware.admin.login, controller.profileFields.view);
    app.post('/admin/profileFieldsList', middleware.admin.login, controller.profileFields.profileFieldsList);
    app.get('/admin/profileFields/add', middleware.admin.login, controller.profileFields.add);
    app.post('/admin/profileFields/addProfileFields', middleware.admin.login, controller.profileFields.addProfileFields);
    app.get('/admin/profileFields/delete/:id', middleware.admin.login, controller.profileFields.delete);
    app.get('/admin/profileFields/edit/:id', middleware.admin.login, controller.profileFields.editProfileFields);
    app.post('/admin/profileFields/edit/:id',middleware.admin.login, controller.profileFields.updateProfileFields);
       
    // [ Contact Us ]
    app.get('/admin/contactUs', middleware.admin.login, controller.contact.view);
    app.post('/admin/contList', middleware.admin.login, controller.contact.contList);
    app.get('/admin/contact/reply/:id', middleware.admin.login, controller.contact.replyPage);
    app.post('/admin/contact/reply/:id', middleware.admin.login, controller.contact.reply);
    app.get('/admin/contact/view/:id', middleware.admin.login, controller.contact.viewReply);

    // [ Subscription ]
    app.get('/admin/subscription', middleware.admin.login, controller.subscription.view);
    app.post('/admin/subscriptionList', middleware.admin.login, controller.subscription.subscriptionList);
    app.get('/admin/subscription/add', middleware.admin.login, controller.subscription.add);
    app.post('/admin/subscription/addSubscription', middleware.admin.login, validation.admin.subscriptionDetail, controller.subscription.addSubscription);
    app.get('/admin/subscription/edit/:id', middleware.admin.login, controller.subscription.edit);
    app.post('/admin/subscription/edit/:id',middleware.admin.login, validation.admin.subscriptionDetail, controller.subscription.editSubscription);
    app.get('/admin/subscription/delete/:id', middleware.admin.login, controller.subscription.deleteSubscription);
    app.get('/admin/subscription/active/:id', middleware.admin.login, controller.subscription.active);

    // [ Testimonial ]
    app.get('/admin/testimonial', middleware.admin.login, controller.testimonial.view);
    app.post('/admin/testimonial/getTestimonialList', middleware.admin.login, controller.testimonial.getTestimonialList);
    app.get('/admin/testimonial/view/:id', middleware.admin.login, controller.testimonial.viewDetails);
    app.get('/admin/testimonial/deleteMany/:id', middleware.admin.login, controller.testimonial.deleteMany);
    app.get('/admin/testimonial/delete/:id', middleware.admin.login, controller.testimonial.delete);

    // [ Calendar ]
    app.get('/admin/calendar', middleware.admin.login, controller.calendar.view);
    app.post('/admin/calendar/getCalendarList', middleware.admin.login, controller.calendar.getCalendarList);
    app.get('/admin/calendar/view/:id', middleware.admin.login, controller.calendar.viewDetails);
    app.get('/admin/calendar/deleteMany/:id', middleware.admin.login, controller.calendar.deleteMany);
    app.get('/admin/calendar/delete/:id', middleware.admin.login, controller.calendar.delete);
}