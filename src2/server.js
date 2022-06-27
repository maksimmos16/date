// require('dotenv').load();

const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const defaultIdentity = 'alice';
var callerId = 'client:quick_start';
// Use a valid Twilio number by adding to your account via https://www.twilio.com/console/phone-numbers/verified
const callerNumber = '+91 81283 80042';

/**
 * Creates an access token with VoiceGrant using your Twilio credentials.
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {string} - The Access Token string
 */
async function tokenGenerator(request, response) {
  // Parse the identity from the http request


  console.log("tokenGenerator: ", request.body);

  console.log("tokenGenerator  NEW: ", request.body);
  var identity = null;
  if (request.method == 'POST') {
    identity = request.body.identity;
  } else {
    identity = request.query.identity;
  }

  if(!identity) {
    identity = defaultIdentity;
  }

  // Used when generating any kind of tokens
  // const accountSid = 'AC5ed64bbb31fb8b05244eb91c8cd32ee5';
  // const apiKey = 'SKd908c0fbf4549f651aac243a45fe33ad';
  // const apiSecret = '1py14W4MQKM1WKWkIghj0H8fTZMM9y1j';


  const accountSid = 'AC2b49d4af64e332eecf22d9978957f681'; //live [ All ]
  // const apiKey = 'SK701a0757586658cf7fb51538407ed8be'; //live [ All ] [ OLD ]
  const apiKey = 'SK2ca1a7d0694d99c30dd16efac04a0dcb'; //live [ All ] [ NEW ]
  // const apiSecret = 'ligADwU8gM3mpqIWwQs6PGEubPzEQ9kv'; //live [ All ] [ OLD ]
  const apiSecret = '2nfM18qKR2uvQ7CCyoIhvogUiBcC8FtR'; //live [ All ]

  // Used specifically for creating Voice tokens
  // const pushCredSid = 'CR584a1d4c58a9ce1c7da1eed11bcb0d78';
  // const outgoingApplicationSid = 'APccc45c940138059bcc1babb7a3578067';


  // const pushCredSid = 'CR59a259836efd1b782795adf4b746a9c4'; //live [ Android ]
  const pushCredSid = 'CRf26c6d2d68b0bbc362007c67c4ad7317'; //live [ IOS ]
    //const outgoingApplicationSid = 'AP2c0b0baa058de0d6b6945ece97c25e18'; //live [ TwiMl App ]
     const outgoingApplicationSid = 'AP674c25dc4ba9bf2cf206dd7804127461'; //live [ TwiMl App ]

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
  console.log('Token:nw' + token.toJwt());
  return response.send(token.toJwt());
}

/**
 * Creates an endpoint that can be used in your TwiML App as the Voice Request Url.
 * <br><br>
 * In order to make an outgoing call using Twilio Voice SDK, you need to provide a
 * TwiML App SID in the Access Token. You can run your server, make it publicly
 * accessible and use `/makeCall` endpoint as the Voice Request Url in your TwiML App.
 * <br><br>
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {Object} - The Response Object with TwiMl, used to respond to an outgoing call
 */
async function makeCall(request, response) {
  // The recipient of the call, a phone number or a client
  
  console.log("makeCall: ", request.body);

  var to = null;
  if (request.method == 'POST') {
    to = request.body.to;
  } else {
    to = request.query.to;
  }

  const voiceResponse = new VoiceResponse();

  if (!to) {
      voiceResponse.say("Congratulations! You have made your first call! Good bye.");
  } else if (isNumber(to)) {
      const dial = voiceResponse.dial({callerId : callerNumber});
      dial.number(to);
  } else {
      const dial = voiceResponse.dial({callerId : callerId});
      dial.client(to);
  }
  console.log('Response:' + voiceResponse.toString());
  return response.send(voiceResponse.toString());
}

/**
 * Makes a call to the specified client using the Twilio REST API.
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {string} - The CallSid
 */
async function placeCall(request, response) {
  // The recipient of the call, a phone number or a client


  console.log("placeCall: ", request.body);

  var to = null;
  if (request.method == 'POST') {
    to = request.body.to;
  } else {
    to = request.query.to;
  }
  console.log(to);
  // The fully qualified URL that should be consulted by Twilio when the call connects.
  var url = request.protocol + '://' + request.get('host') + '/incoming';
  console.log(url);
  const accountSid = 'AC2b49d4af64e332eecf22d9978957f681';
  const apiKey = 'SK2ca1a7d0694d99c30dd16efac04a0dcb';
  const apiSecret = '2nfM18qKR2uvQ7CCyoIhvogUiBcC8FtR';
  const client = require('twilio')(apiKey, apiSecret, { accountSid: accountSid } );

  if (!to) {
    console.log("Calling default client:" + defaultIdentity);
    call = await client.api.calls.create({
      url: url,
      to: 'client:' + defaultIdentity,
      from: callerId,
    });
  } else if (isNumber(to)) {
    console.log("Calling number:" + to);
    call = await client.api.calls.create({
      url: url,
      to: to,
      from: callerNumber,
    });
  } else {
    console.log("Calling client:" + to);
    call =  await client.api.calls.create({
      url: url,
      to: 'client:' + to,
      from: callerId,
    });
  }
  console.log(call.sid)
  //call.then(console.log(call.sid));
  return response.send(call.sid);
}

/**
 * Creates an endpoint that plays back a greeting.
 */
function incoming() {
  const voiceResponse = new VoiceResponse();
  voiceResponse.say("Congratulations! You have received your first inbound call! Good bye.");
  console.log('Response:' + voiceResponse.toString());
  return voiceResponse.toString();
}

function welcome() {
  const voiceResponse = new VoiceResponse();
  voiceResponse.say("Welcome to Twilio");
  console.log('Response:' + voiceResponse.toString());
  return voiceResponse.toString();
}

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

exports.tokenGenerator = tokenGenerator;
exports.makeCall = makeCall;
exports.placeCall = placeCall;
exports.incoming = incoming;
exports.welcome = welcome;
