var jwt = require('jsonwebtoken');
var successMessage = { status: 'success', message:"", data:{}};
var failedMessage = { status: 'fail', message:"", data:{}};


module.exports = function(model,config) {
    var module = {};
    module.login = function(req, res, next){
       let token = req.headers.token;   
       // console.log('login---------->>>req.headers.token: ',req.headers.token);    
       jwt.verify(token, config.jwt_secret,async function(err, decoded) {
            if(err) {
                // console.log('middleware >> login---------->>>>err: ',err);
                failedMessage.status = 'jwtTokenError'
                failedMessage.message = "Failed to authenticate!";
                return res.status(401).send(failedMessage);
            } else {
                var userDetail = await model.User.findOne({'loginToken':token});
                if(!userDetail){
                    // console.log('middleware >> login---------->>>>jwtTokenError ');
                    failedMessage.status = 'jwtTokenError'
                    failedMessage.message = "Login user token mismatch. please try again";
                    return res.status(401).send(failedMessage);
                } else {

                    console.log("middleware token check worked");
                    // console.log("req.session.userData middleware:::",req.session.userData);
                    // added for multiple user login
                    // if (req.session.userData != undefined && req.session.userData.isLogin == true && req.session.userData.loginToken) {
                    //     next();
                    // } else {
                        
                    //     console.log(":::::::::::::::::::::::::::::User session deleted::::::::::::::::::::::::::",req.session.userData);
                    //     delete req.session.userData;

                    //     failedMessage.status = 'userLoginError'
                    //     failedMessage.message = "More than one session of same User not allowed";
                    //     return res.status(401).send(failedMessage);
                    // }
                    // added for multiple user login

                    next();
                }
            }
        });
    };

    return module;
}    
