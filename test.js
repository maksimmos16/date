global.mongoose = require('mongoose');
require('./config/database.js')();
var model = require('./app/models/index')(mongoose);




var dt = new Date();


console.log(dt.getTimezoneOffset());
