module.exports = function(model, config) {
	var module = {};

	module.getCmsPage = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{} };
		try {
			let slug = req.params.id;
			console.log('slug: ',slug);
			let cmsPage = await model.CMSPages.findOne({slug: slug});
			console.log('cmsPage: ',cmsPage);

			successMessage.data = cmsPage;
			successMessage.message = "CMS page loaded successfully";
			res.send(successMessage);
		} catch(e) {
			console.log('getCmsPage:::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	return module;
}