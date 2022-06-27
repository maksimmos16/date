var dateformat = require('dateformat');

module.exports = function(model) {
    var module = {};

    module.login = async function(req, res, next){
        if(req.session.admin) {
                // var userDetail = await model.User.findOne({where:{'id':req.session.admin.id}});
                // req.session.admin = userDetail;
                // var userPendingEmailCount = await model.SupportManagement.findAll({where:{status:'pending'},order: [ [ 'id', 'DESC' ]],include: [{ model:model.User,as:'userDetail'}]}); 
                // res.locals.userPendingAllEmailData = userPendingEmailCount;
                // var userDetailLastThreeRecord = [];
                // var emailLength = 0;
                // if(userPendingEmailCount.length < 3){
                //     emailLength = userPendingEmailCount.length;
                // }  else {
                //     emailLength = 3;
                // } 
                // for (var i=0; i < emailLength ; i++) {
                //     var userName = userPendingEmailCount[i].name;
                //     var message = userPendingEmailCount[i].message;
                //     var createDate = dateformat(userPendingEmailCount[i].createdAt,'yyyy-mm-dd HH:MM:ss');
                //     var Image = userPendingEmailCount[i].userDetail.profilePic;
                //     userDetailLastThreeRecord.push({'name':userName,'message':message,'date':createDate,'image':Image})
                // }
                // res.locals.userPendingLastThreeRecord = userDetailLastThreeRecord;
                // var setting = await model.Setting.findOne({});
                // res.locals.settingDetail = setting;
                next();
        } else {
                req.flash('error',"Please Login");
                res.redirect('/admin');
        }
    };

    // [ ]
    module.isLogin = async function(req, res, next){
        try {            
            if (req.session.admin) {
                

                // [ New ]
                res.redirect('/admin/dashboard');
            } else {
                next();              
            }   
        } catch (error) {
            console.log("admin >> isLogin:::::::::::::>>error: ",error);
        }        
    };

    // [ OLD ]
    // module.isLogin = async function(req, res, next){
    //     if (req.session.admin) {
    //             var userDetail = await model.User.findOne({where:{'id':req.session.admin.id}});
    //             req.session.admin = userDetail;
    //             var userPendingEmailCount = await model.SupportManagement.findAll({where:{status:'pending'},order: [ [ 'id', 'DESC' ]],include: [{ model:model.User,as:'userDetail'}]}); 
    //             res.locals.userPendingAllEmailData = userPendingEmailCount;
    //             var userDetailLastThreeRecord = [];
    //             var emailLength = 0;
    //             if(userPendingEmailCount.length < 3){
    //                 emailLength = userPendingEmailCount.length;
    //             }  else {
    //                 emailLength = 3;
    //             } 
    //             for (var i=0; i < emailLength ; i++) {
    //                 var userName = userPendingEmailCount[i].name;
    //                 var message = userPendingEmailCount[i].message;
    //                 var createDate = dateformat(userPendingEmailCount[i].createdAt,'yyyy-mm-dd HH:MM:ss');
    //                 var Image = userPendingEmailCount[i].userDetail.profilePic;
    //                 userDetailLastThreeRecord.push({'name':userName,'message':message,'date':createDate,'image':Image})
    //             }
    //             res.locals.userPendingLastThreeRecord = userDetailLastThreeRecord;
    //             var setting = await model.Setting.findOne({});
    //             res.locals.settingDetail = setting;

    //             res.redirect('/admin/dashboard');            
    //     } else {
    //             var userPendingEmailCount = await model.SupportManagement.findAll({where:{status:'pending'},order: [ [ 'id', 'DESC' ]],include: [{ model:model.User,as:'userDetail'}]}); 
    //             res.locals.userPendingAllEmailData = userPendingEmailCount;
    //             var userDetailLastThreeRecord = [];
    //             var emailLength = 0;
    //             if(userPendingEmailCount.length < 3){
    //                 emailLength = userPendingEmailCount.length;
    //             }  else {
    //                 emailLength = 3;
    //             } 
    //             for (var i=0; i < emailLength ; i++) {
    //                 var userName = userPendingEmailCount[i].name;
    //                 var message = userPendingEmailCount[i].message;
    //                 var createDate = dateformat(userPendingEmailCount[i].createdAt,'yyyy-mm-dd HH:MM:ss');
    //                 var Image = userPendingEmailCount[i].userDetail.profilePic;
    //                 userDetailLastThreeRecord.push({'name':userName,'message':message,'date':createDate,'image':Image})
    //             }
    //             res.locals.userPendingLastThreeRecord = userDetailLastThreeRecord;
    //             var setting = await model.Setting.findOne({});
    //             res.locals.settingDetail = setting;
    //             next();
    //     }
    // };  

    return module;
}    