
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
			// let cmspages = await model.CMSPages.find({'adminId': req.session.admin._id});
		   	res.render('admin/vehicle/list', {
				title: 'All Vehicles ',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'vehicle',
				cmspages : null
			});
		} else {
			res.redirect('/admin');
		}
	}
    
	return module;
}
