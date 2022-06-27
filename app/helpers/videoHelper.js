var config = require('../../config/constants.js');
const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const VoiceGrant = AccessToken.VoiceGrant;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const defaultIdentity = 'alice';
var callerId = 'client:quick_start';
// Use a valid Twilio number by adding to your account via https://www.twilio.com/console/phone-numbers/verified
const callerNumber = '+1 770 373 5755';

// Used when generating any kind of tokens
const twilioAccountSid = config.accountSid;
const twilioApiKey = config.apiKey;
const twilioApiSecret = config.apiKeySecret;
const twilioAuthToken = config.authToken;

const tClient = twilio(twilioAccountSid, twilioAuthToken);
const pClient = new twilio(twilioApiKey, twilioApiSecret, {accountSid: twilioAccountSid});


module.exports = {

	// [ APP - Token ]
	tokenGenerator: function(type, identity, roomName) {
	  
	  // Parse the identity from the http request
	  var identity = identity;
	  if(!identity) {
	    identity = defaultIdentity;
	  }

	  // Used when generating any kind of tokens
	  // const accountSid = 'AC5ed64bbb31fb8b05244eb91c8cd32ee5';
	  // const apiKey = 'SKd908c0fbf4549f651aac243a45fe33ad';
	  // const apiSecret = '1py14W4MQKM1WKWkIghj0H8fTZMM9y1j';

	  const accountSid = 'AC4cc994dba4ef0e6b8dea81f8fbcd5042'; //live [ All ]
	  const apiKey = 'SK7b9689e277f64ba5442c298e0b5cf691'; //live [ All ]
	  const apiSecret = 'iDxAxRQBP0iEMYIeP5lthNblM9XWBdDm'; //live [ All ]

	  // Used specifically for creating Voice tokens
	  // const pushCredSid = 'CR584a1d4c58a9ce1c7da1eed11bcb0d78';
	  // const outgoingApplicationSid = 'APccc45c940138059bcc1babb7a3578067';

	  // const pushCredSid = 'CR59a259836efd1b782795adf4b746a9c4'; //live [ Android ]
	  const pushCredSid = 'CR73f57a58778256f405ac5ce6562cccc2'; //live [ IOS ]
	  const outgoingApplicationSid = 'AP2c0b0baa058de0d6b6945ece97c25e18'; //live

	  // Create an access token which we will sign and return to the client,
	  // containing the grant we just created
	  const voiceGrant = new VoiceGrant({
	      outgoingApplicationSid: outgoingApplicationSid,
	      pushCredentialSid: pushCredSid
	    });

	  // Create an access token which we will sign and return to the client,
	  // containing the grant we just created
	  const token = new AccessToken(accountSid, apiKey, apiSecret);
	  token.addGrant(voiceGrant);
	  token.identity = identity;
	  console.log('Token:' + token.toJwt());
	  return token.toJwt();
	},

	makeCall: function(to) {
	  // The recipient of the call, a phone number or a client
	  var to = to;
	  const voiceResponse = new VoiceResponse();

	  function isNumber(to) {
		  if(to.length == 1) {
		    if(!isNaN(to)) {
		      console.log("It is a 1 digit long number" + to);
		      return true;
		    }
		  } else if(String(to).charAt(0) == '+') {
		    number = to.substring(1);
		    if(!isNaN(number)) {
		      console.log("It is a number " + to);
		      return true;
		    };
		  } else {
		    if(!isNaN(to)) {
		      console.log("It is a number " + to);
		      return true;
		    }
		  }
		  console.log("not a number");
		  return false;
		}

	  if (!to) {
	  	console.log('here');
	      voiceResponse.say("Congratulations! You have made your first call! Good bye.");
	  	console.log('here - voiceResponse: ',voiceResponse);
	  } else if (isNumber(to)) {
	  	  console.log('number');
	      const dial = voiceResponse.dial({callerId : callerNumber});
	      console.log('di: ',dial);
	      dial.number(to);
	  } else {
	  	  console.log('else');
	      const dial = voiceResponse.dial({callerId : callerId});
	      console.log('di: ',dial);
	      dial.client(to);
	  }
	  console.log('Response:' + voiceResponse.toString());
	  return voiceResponse.toString();
	},

	createToken: function(type, identity, roomName) {
		console.log('createToken------------->>>>identity: '+identity);
		//type = 'video, audio, chat';
		var grant = null;
		if (type == 'video') {
			// Create Video Grant
			grant = new VideoGrant({
			  room: roomName,
			});			
		}
		let token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret);
		token.addGrant(grant);
		token.identity = identity;

		return token.toJwt();
	},

	getConnectedParticipant: async function(roomName, identity) {
		
		return await pClient.video.rooms(roomName).
		participants.get(identity).
		fetch().
		then(participant => participant).
		catch(e => null);
	},

	getParticipantList: async function(roomName, data) {
		//data = {status: 'connected'} / {status: 'disconnected'}
		return await pClient.video.rooms(roomName).participants.
		each(data, (participant) => {
		    console.log('getParticipantList------->>>>participant.sid: ',participant.sid);
		});
	},
	removeParticipant: async function(roomName, identity) {
		return await pClient.video.rooms(roomName).
		participants(identity).
		update({status: 'disconnected'}).
		then(participant => {
		    console.log('removeParticipant---->>>>participant.status',participant.status);
		}).
		catch(e => console.log('removeParticipant---->>>error: ',e));	
	},

	createRoom: async function(roomName) {
		return await tClient.video.rooms.create({uniqueName: roomName}).then(room => room.sid).catch(e => null);
	},
	createP2P: async function(roomName) {
		return await tClient.video.rooms.create({
			uniqueName: roomName, 
			enableTurn: true,
			statusCallback: 'http://192.168.43.93.xip.io:3000/videoStatusCallback',
			type: 'peer-to-peer'
		}).then(room => room.sid).catch(e => null);
	},
	getRoom: async function(roomName) {
		return await tClient.video.rooms(roomName).fetch().then().catch(e => null);
	},
	getRoomList: async function(data) {
		if (!data) {
			data = {				
				limit: 20
			}
		}
		return await tClient.video.rooms.list(data).then().catch(e => []);
	},
	completeRoom: async function(roomName) {
		return await tClient.video.rooms(roomName).update({status: 'completed'}).then().catch(e => null);
	}
}