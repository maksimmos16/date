var request = require('request');
var CronJob = require('cron').CronJob;

module.exports = function(model){

    new CronJob('0 * * * *', function() {
        // every hour
        savePost();
    }, null, true);
    
    savePost();

    async function savePost(){
        try {
            let allInstaUser = await model.User.find({role: 'user', instaId: {$ne: ''}, instaToken: {$ne: ''}, isDeleted: false},{instaId: 1, instaToken: 1});
            if (allInstaUser) {
                for (let i = 0; i < allInstaUser.length; i++) {
                    let instaId = allInstaUser[i].instaId;
                    let instaToken = allInstaUser[i].instaToken;

                    let mediaListUrl = 'https://graph.instagram.com/'+instaId+'/media?access_token='+instaToken;
                    request(mediaListUrl, async function(err, resp, body) {
                        // console.log('cron >> savePost----------->>>>body: ',body);
                        if (typeof body == 'string') {
                            body = helper.IsJsonString(body) ? JSON.parse(body) : null;
                        }
                        if (body && body.data) {

                            let mediaList = body.data;
                            for (let j = 0; j < mediaList.length; j++) {
                                let mediaDetailUrl =  'https://graph.instagram.com/'+mediaList[j].id+'?fields=id,media_type,media_url,username,timestamp,children&access_token='+instaToken;
                                request(mediaDetailUrl, async function(err1, resp1, body1) {
                                    // console.log('cron >> savePost--------->>>body1: ',body1);
                                    if (typeof body1 == 'string') {
                                        body1 = helper.IsJsonString(body1) ? JSON.parse(body1) : null;
                                    }
                                    let instaUsername = body1.username;
                                    let instaMediaId = body1.id;
                                    let mediaType = body1.media_type;
                                    let mediaUrl = body1.media_url;
                                    let timestamp = new Date(body1.timestamp);
                                    let obj = {
                                        instaId: instaId,
                                        instaUsername: instaUsername,
                                        instaMediaId: instaMediaId,
                                        mediaType: mediaType,
                                        mediaUrl: mediaUrl,
                                        parentMediaId: '',
                                        createdAt: timestamp,
                                        updatedAt: new Date()
                                    }

                                    let feedData = await model.InstaFeed.findOneAndUpdate({instaMediaId: instaMediaId},obj,{upsert: true});
                                    // console.log('cront >> savePost------------>>>feedData: ',feedData);
                                    if (mediaType == 'CAROUSEL_ALBUM' && body1.children && body1.children.data && body1.children.data.length && feedData) {
                                        let parentMediaId = instaMediaId
                                        let mediaChildren = body1.children.data;

                                        for (let k = 0; k < mediaChildren.length; k++) {
                                            let mediaChildDetailUrl =  'https://graph.instagram.com/'+mediaChildren[k].id+'?fields=id,media_type,media_url,username,timestamp,children&access_token='+instaToken;
                                            request(mediaChildDetailUrl, async function(err2, resp2, body2) {
                                                if (typeof body2 == 'string') {
                                                    body2 = helper.IsJsonString(body2) ? JSON.parse(body2) : null;
                                                }
                                                let instaUsername1 = body2.username;
                                                let instaMediaId1 = body2.id;
                                                let mediaType1 = body2.media_type;
                                                let mediaUrl1 = body2.media_url;
                                                let timestamp1 = new Date(body2.timestamp);
                                                let obj = {
                                                    instaId: instaId,
                                                    instaUsername: instaUsername1,
                                                    instaMediaId: instaMediaId1,
                                                    mediaType: mediaType1,
                                                    mediaUrl: mediaUrl1,
                                                    parentMediaId: parentMediaId,
                                                    createdAt: timestamp1,
                                                    updatedAt: new Date()
                                                }

                                                await model.InstaFeed.findOneAndUpdate({instaMediaId: instaMediaId1},obj,{upsert: true});
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });                
                }
            } else {
                console.log('cron >> savePost-----else------->>>>"no insta user found"');
            }
        } catch(e) {
            console.log('cron >> savePost::::::::::::::>>>>e: ',e);
        }
    }
}

