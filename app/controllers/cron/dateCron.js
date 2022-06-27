var request = require('request');
var CronJob = require('cron').CronJob;

module.exports = function(model){

new CronJob('0 * * * *', function() {
    // every hour
    sendFeedbackMsg();
    remainderDate();
    updateOnlineOffline();
    deleteDummyUser();
}, null, true);

	async function sendFeedbackMsg(){
        console.log('Feedback Cron Running.....');
        var oneDay = (24*60*60*1000) * 1; //1 day = 86400000 ms
        let yesterday = new Date();
        yesterday.setTime(yesterday.getTime() - oneDay);

        var oneDayOneHour = ((24*60*60*1000) * 1) + (1*60*60*1000); //1 day 1 hour = 90000000 ms
        let yesterdayMOne = new Date();
        yesterdayMOne.setTime(yesterdayMOne.getTime() - oneDayOneHour);
        
        let datersId = await model.Dates.find({"dateTime" : { $gte: yesterdayMOne, $lt: yesterday }, "isApproved" : true});

        let userId = [];
        for(let i = 0; i < datersId.length; i++){
            userId.push(datersId[i].initUserId, datersId[i].initOppId);

            let ttpp = await model.UserNotification.find({
                senderId: datersId[i].initUserId,
                receiverId: datersId[i].initOppId,
                type: 'feedback'
            });
            if(ttpp.length > 0){
                console.log('Already Enter.....');
            }
            else {
                await model.UserNotification.create({
                    senderId: datersId[i].initUserId,
                    receiverId: datersId[i].initOppId,
                    type: 'feedback',
                    text: 'Please Visit Feedback',
                    isDeleted: false
                });
                await model.UserNotification.create({
                    senderId: datersId[i].initOppId,
                    receiverId: datersId[i].initUserId,
                    type: 'feedback',
                    text: 'Please Visit Feedback',
                    isDeleted: false
                });
            }
        }

        let userData = await model.User.find({'_id':userId});
        let adData = await model.User.findOne({"role" : "admin"}).select(['role']);
        let socketId = [];
        for(let i = 0; i < userData.length; i++){
            socketId.push(userData[i].socketId);
        }

        if(socketId.length > 0){
            sendMsg(socketId);
        }
    }

    async function remainderDate(){

        console.log('Date Remainder Cron Running.....');
        let currentTime = new Date();
        let timeArr = [ { 'time': 8 } , { 'time': 4 }, { 'time': 2 } ]

        for (var i = 0; i < timeArr.length; i++) {
            
            var tt = (timeArr[i].time - 1);
            var preTime = ((tt)*30*60*1000) * 1;
            var aftTime = ((timeArr[i].time)*30*60*1000) * 1;
            let preTimeQue = new Date();
            preTimeQue.setTime(preTimeQue.getTime() + preTime);

            let aftTimeQue = new Date();
            aftTimeQue.setTime(aftTimeQue.getTime() + aftTime);
            console.log('preTimeQue: ',preTimeQue);
            console.log('aftTimeQue: ',aftTimeQue);
            let daters = await model.Dates.find({"dateTime" : { $gte:preTimeQue , $lt: aftTimeQue }});
            console.log('Dates - Remainder: ',daters);

            for (var j = 0; j < daters.length; j++) {
                console.log('daters[j]: ',daters[j]);
                let userDataS = await model.User.findOne({'_id':daters[j].initUserId}).select(['socketId', 'username']);
                let userDataR = await model.User.findOne({'_id':daters[j].initOppId}).select(['socketId', 'username']);
                let ttpp = await model.UserNotification.find({
                    senderId: daters[j].initUserId,
                    receiverId: daters[j].initOppId,
                    type: 'remainder',
                    text: timeArr[i].time+' Hours Left For Your Date With '+userDataS.username
                });
                if(ttpp.length > 0){
                    console.log('Already Sent.....');
                }
                else {
                    await model.UserNotification.create({
                        senderId: daters[j].initUserId,
                        receiverId: daters[j].initOppId,
                        type: 'remainder',
                        text: timeArr[i].time + ' Hours Left For Your Date With '+userDataS.username,
                        isDeleted: false
                    });

                    await model.UserNotification.create({
                        senderId: daters[j].initOppId,
                        receiverId: daters[j].initUserId,
                        type: 'remainder',
                        text: timeArr[i].time + ' Hours Left For Your Date With '+userDataR.username,
                        isDeleted: false
                    });
                    var clientS = io.sockets.connected[userDataS.socketId];
                    var clientR = io.sockets.connected[userDataR.socketId];
                    let nCountS = await model.UserNotification.countDocuments({receiverId: userDataS._id, isRead: false});
                    let nCountR = await model.UserNotification.countDocuments({receiverId: userDataR._id, isRead: false});

                    if (clientS) { 
                        clientS.emit('userNotification', {
                            'notification': userDataS,
                            'ncount': nCountS
                        });
                    } else {
                        "do nothing"
                    }

                    if (clientR) { 
                        clientR.emit('userNotification', {
                            'notification': userDataR,
                            'ncount': nCountR
                        });
                    } else {
                        "do nothing"
                    }
                }
            }
        }
    }

	async function updateOnlineOffline(){
        try{

            console.log('update Online/Offline Cron Running.....');
        
            let userData = await model.User.find({isDeleted:false,role:'user'});
            
            if(userData.length > 0){
                for(let i = 0; i < userData.length; i++){
                    
                    let userOnline = await model.userLogEvent.findOne({'userId':userData[i]._id});
                    if(userOnline){
                        if(userOnline.isLogin == false){

                            await model.User.updateOne({_id: userOnline.userId},{isOnline: false,isLogin:false,loginToken:'',deviceToken:'',updatedAt: new Date()});
                            await model.userLogEvent.deleteOne({'userId':userOnline.userId});
                        }
                    } else {
                        await model.User.updateOne({_id: userData[i]._id},{isOnline: false,isLogin:false,loginToken:'',deviceToken:'',updatedAt: new Date()});
                    }
                }
            }

        } catch(e){
            console.log("online/offline",e);
        }
    }

    async function deleteDummyUser(){
        try{

            console.log('Dummy user Cron Running............');

            let userData = await model.User.find({isDeleted:false,role:'user',firstName:'',lastName:'',username:'',dob:null,gender:''});
            
            if(userData.length > 0){
                for(let i = 0; i < userData.length; i++){
                    await model.User.deleteOne({_id:userData[i]._id});
                }
            }
        } catch(e){
            console.log("Delete Dummy users::::",e);
        }
    }

	return module;
}

const sendMsg = (data) => {

    console.log("feedback cron :::::::::::: ---->>>  : ",data);
    
    for(let i = 0; i < data.length; i++){

        io.sockets.connected[data[i]].emit('dateFeedback', {
            'message': 'Give Your Feedback For The Date You Have.'
        });
    }
}