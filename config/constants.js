const env = process.env.NODE_ENV || "localhost"
var config = {
	development: {
		"port": 831,
		"baseUrl": "https://easydate.aistechnolabs.in/",
		"siteName": "EasyDate",
		"jwt_secret": "123123",
	    "jwt_expire": "365d",
		"otpMaxTime":600,
        "minAge": 18,
        "maxAge": 100,
        "minDistance": 0, //km
        "maxDistance": 500, //km

        "iphoneVersion":"1.0",
        "androidVersion":"1.0",
        "androidPackage": "com.app.anyflava",
        "appStoreLink": "#",
        "playStoreLink": "#",
        "webLink": "https://easydate.aistechnolabs.in/",
        "scheme": "anyFlava",

        /*"stripeSecretKey": "sk_test_TbIdYLr6GSJNvLBJ6EFSlKvy00hbNblRDU", //test chetanl
        "stripePublishKey": "pk_test_trfMc6Lz6Dk6FkyiFLBTuZOX00v5kV3o6K", //test*/

        "stripeSecretKey": "sk_test_UhyFGoVWAm0wR7vKsk9iHFwV", //test
        "stripePublishKey": "pk_test_jCXZ6oV3ibXIY0sseys0Lpro", //test

        // "googleMapKey": "AIzaSyBZoOxzzUEgRDaja12SmlkLptDM_NdrSCQ", //test
        "googleMapKey": "AIzaSyBWagyEkBuO_W1VUu2d2YcMaZvl2hDmwaU",
        // "googleMapKey": "AIzaSyDT9wck6kTLd6FWauECcFQb0BBLNtCgUjc", // this is any flava client key

        "coinMerchantId": "",
        "coinKey": "50d75007a17f08841bedb323df13890ffb25932af63fbaae48039966af3a5bc1", //test
        "coinSecret": "dA98d6fBf6552a9eda0F273aF27E2457CF5754735F527f240941B3935CE63a72", //test
        "btcChange": 6608.97, //usd = 1 btc
        "bchChange": 214.61, // usd = 1 bch
        "ltcChange": 39.41, //usd = 1 ltc
        "ethChange": 135.29, //usd = 1 eth

        "instaAuthAPI": "http://api.instagram.com/oauth/authorize",
        "instaClientId":"244250316606132", //test
        "instaClientSecret":"181d47d26c246f8918f55917e5eccf63", //test

        "defaultProfile": "upload/photos/defaultUser.png",

        // [ Twilio ]
        //"accountSid": "AC2b49d4af64e332eecf22d9978957f681", //test chetanl
        //"authToken": "7d6391daf59ddee24e557af3fc1b2042", //test
        //"apiKey": "SK2ca1a7d0694d99c30dd16efac04a0dcb", //test
        //"apiKeySecret": "2nfM18qKR2uvQ7CCyoIhvogUiBcC8FtR", //test
        //"callerNumber": "+19073181637", //test
        "accountSid": "AC84c83d1376b7b24c39491dd6fc9dbd58", //test dan        
        "authToken": "7e97013ebbb1fca76705286700a0cb2a", //test dan
        "apiKey": "AC808e5bdc65192f05634087b4a81cbdf3", //test dan
        "apiKeySecret": "0aa87a802d46cb783034cc101134d455", //test dan
        "callerNumber": "+19705949722", //test dan

        "iosKeyId": "DH39ASFAS4",
        "iosTeamId": "T4YKTL658N",
        "iosNotificationTopic": "com.ais.DateRite", // [ bundle id ]
        "iosProduction": false, // testing = false 
        
        "mail_service": "gmail",
        //"smtp_host": "email-smtp.eu-west-1.amazonaws.com",
        //"smtp_port": "587",
        //"smtp_user": "node1@aistechnolabs.co.uk", //test
        //"smtp_pass": "AIS@#!@#$!@SW", //test
        "smtp_sender_mail_id": "support@gmail.com",
        "smtp_host": "smtp.gmail.com",
        "smtp_port": "465",
        "smtp_user": "nodejs2121@gmail.com", //test
        "smtp_pass": "hello@1234", //test
	},
	production: {
		
	},
	localhost: {
		"port": 3005,
		"baseUrl": "http://localhost:3005/",
		"siteName": "EasyDate",
		"jwt_secret": "123123",
	    "jwt_expire": "365d",
		"otpMaxTime":600,
        "minAge": 18,
        "maxAge": 100,
        "minDistance": 0, //km
        "maxDistance": 500, //km

        "iphoneVersion":"1.0",
        "androidVersion":"1.0",
        "androidPackage": "com.app.anyflava",
        "appStoreLink": "#",
        "playStoreLink": "#",
        "webLink": "http://localhost:3005/",
        "scheme": "anyFlava",

        /*"stripeSecretKey": "sk_test_TbIdYLr6GSJNvLBJ6EFSlKvy00hbNblRDU", //test chetanl
        "stripePublishKey": "pk_test_trfMc6Lz6Dk6FkyiFLBTuZOX00v5kV3o6K", //test*/

        "stripeSecretKey": "sk_test_UhyFGoVWAm0wR7vKsk9iHFwV", //test
        "stripePublishKey": "pk_test_jCXZ6oV3ibXIY0sseys0Lpro", //test

        // "googleMapKey": "AIzaSyBZoOxzzUEgRDaja12SmlkLptDM_NdrSCQ", //test
        "googleMapKey": "AIzaSyBWagyEkBuO_W1VUu2d2YcMaZvl2hDmwaU",
        // "googleMapKey": "AIzaSyDT9wck6kTLd6FWauECcFQb0BBLNtCgUjc", // this is any flava client key

        "coinMerchantId": "",
        "coinKey": "50d75007a17f08841bedb323df13890ffb25932af63fbaae48039966af3a5bc1", //test
        "coinSecret": "dA98d6fBf6552a9eda0F273aF27E2457CF5754735F527f240941B3935CE63a72", //test
        "btcChange": 6608.97, //usd = 1 btc
        "bchChange": 214.61, // usd = 1 bch
        "ltcChange": 39.41, //usd = 1 ltc
        "ethChange": 135.29, //usd = 1 eth

        "instaAuthAPI": "http://api.instagram.com/oauth/authorize",
        "instaClientId":"244250316606132", //test
        "instaClientSecret":"181d47d26c246f8918f55917e5eccf63", //test

        "defaultProfile": "upload/photos/defaultUser.png",

        // [ Twilio ]
        //"accountSid": "AC2b49d4af64e332eecf22d9978957f681", //test chetanl
        //"authToken": "7d6391daf59ddee24e557af3fc1b2042", //test
        //"apiKey": "SK2ca1a7d0694d99c30dd16efac04a0dcb", //test
        //"apiKeySecret": "2nfM18qKR2uvQ7CCyoIhvogUiBcC8FtR", //test
        //"callerNumber": "+19073181637", //test
        "accountSid": "AC84c83d1376b7b24c39491dd6fc9dbd58", //test dan        
        "authToken": "7e97013ebbb1fca76705286700a0cb2a", //test dan
        "apiKey": "AC808e5bdc65192f05634087b4a81cbdf3", //test dan
        "apiKeySecret": "0aa87a802d46cb783034cc101134d455", //test dan
        "callerNumber": "+19705949722", //test dan

        "iosKeyId": "DH39ASFAS4",
        "iosTeamId": "T4YKTL658N",
        "iosNotificationTopic": "com.ais.DateRite", // [ bundle id ]
        "iosProduction": false, // testing = false 
        
        "mail_service": "gmail",
        //"smtp_host": "email-smtp.eu-west-1.amazonaws.com",
        //"smtp_port": "587",
        //"smtp_user": "node1@aistechnolabs.co.uk", //test
        //"smtp_pass": "AIS@#!@#$!@SW", //test
        "smtp_sender_mail_id": "support@gmail.com",
        "smtp_host": "smtp.gmail.com",
        "smtp_port": "465",
        "smtp_user": "nodejs2121@gmail.com", //test
        "smtp_pass": "hello@1234", //test
	}
}
module.exports = config[env]
