const Router = require('express').Router;

const {registerBind, sendNotification} = require('./notification_handler');
const tokenGenerator = require('./token_generator');
const config = require('./config');

const router = new Router();

// Convert keys to camelCase to conform with the twilio-node api definition contract
const camelCase = require('camelcase');
function camelCaseKeys(hashmap) {
  var newhashmap = {};
  Object.keys(hashmap).forEach(function(key) {
    var newkey = camelCase(key);
    newhashmap[newkey] = hashmap[key];
  });
  return newhashmap;
};

router.get('/token/:id?', (req, res) => {
  console.log('Call - Token - Get: ',req.params);
  console.log('Call - Token - Get: ',req.body);
  const id = req.params.id;
  res.send(tokenGenerator(id));
});

router.post('/token', (req, res) => {
  console.log('Call - Token - Post: ',req.params);
  console.log('Call - Token - Post: ',req.body);
  const id = req.body.id;
  res.send(tokenGenerator(id));
});

router.post('/register', (req, res) => {
  console.log('Call - Register - Post: ',req.params);
  console.log('Call - Register - Post: ',req.body);
  var content = camelCaseKeys(req.body);
  registerBind(content).then((data) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(data.status);
    res.send(data.data);
  });
});

router.post('/send-notification', (req, res) => {
  console.log('Call - notification - Post: ',req.params);
  console.log('Call - notification - Post: ',req.body);
  var content = camelCaseKeys(req.body);
  sendNotification(content).then((data) => {
    res.status(data.status);
    res.send(data.data);
  });
});

router.get('/config', (req, res) => {
  console.log('Here: ',req.body);
  console.log('Here: ',req.params);
  res.json(config);
});


//Create a facebook-messenger binding based on the authentication webhook from Facebook
router.post('/messenger_auth', function(req, res) {
  //Extract the request received from Facebook
  const message = req.body.entry[0].messaging[0];
  console.log(message);
  // Set user identity using their fb messenger user id
  const identity = message.sender.id;
  //Let's create a new facebook-messenger Binding for our user
  const binding = {
    "identity":identity,
    "BindingType":'facebook-messenger',
    "Address":message.sender.id
  };
  registerBind(camelCaseKeys(binding)).then((data) => {
    res.status(data.status);
    res.send(data.data);
  });
});

//Verification endpoint for Facebook needed to register a webhook.
router.get('/messenger_auth', function(req, res) {
  console.log(req.query["hub.challenge"]);
  res.send(req.query["hub.challenge"]);
});



module.exports = router;
