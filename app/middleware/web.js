var jwt = require('jsonwebtoken');
var successMessage = { status: 'success', message:"", data:{}};
var failedMessage = { status: 'fail', message:"", data:{}};


module.exports = function(model,config) {
    var module = {};
    module.login = function(req, res, next){
        let token = (req.session.userData && req.session.userData.loginToken) ? req.session.userData.loginToken : '';
        // console.log('login------------->>>>token: ',token);
        jwt.verify(token, config.jwt_secret,async function(err, decoded) {
            if(err) {
                failedMessage.status = 'jwtTokenError'
                failedMessage.message = "Failed to authenticate!";
                // return res.status(401).send(failedMessage);
                res.redirect('/');
            } else {
                var userDetail = await model.User.findOne({'loginToken':token, isDeleted: false});
                // console.log('login--------------->>>>>userDetail: ',userDetail);
                if(userDetail){
                    next();
                } else {                    
                    failedMessage.status = 'jwtTokenError'
                    failedMessage.message = "Login user token mismatch. please try again";
                    // return res.status(401).send(failedMessage);
                    delete req.session.userData;
                    res.redirect('/');
                }
            }
        });
    };

    module.loginCheck = function (req, res, next) {
        // console.log('loginCheck----------->>>>>>req.session.userData: ',req.session.userData);
        if (req.session.userData != undefined && req.session.userData.isLogin == true && req.session.userData.loginToken) {
            let src = req.originalUrl;
            if (src == '/') {
                res.redirect('/home');
            } else {
                next();
            }
        } else {
            delete req.session.userData;
            res.redirect('/login');
        }
    };


    return module;
}    
