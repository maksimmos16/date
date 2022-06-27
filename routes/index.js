module.exports = function (app, model, controllers) {
	require('./admin.js')(app, model, controllers.admin);
	require('./api.js')(app, model, controllers.api);
	require('./web.js')(app, model, controllers.web);
}	