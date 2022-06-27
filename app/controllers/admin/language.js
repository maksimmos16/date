
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.lang = async function(req, res){
		if(req.session.admin){
            
            // [ Language Keywords Fetch ]
            var langKeyList = await model.Language.find();

		   	res.render('admin/language/lang', {
				title: 'Language Keywords Setup',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'language',
				langKeyList:langKeyList
			});
		} else {
			res.redirect('/admin');
		}
	}
    
    // [ Add ]
	module.addKeyword = async function(req, res){
		if(req.session.admin){
            
		   	res.render('admin/language/addLang', {
				title: 'Language Keywords Setup',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'language'
			});
		} else {
			res.redirect('/admin');
		}
    }

    // [ Save ]
	module.langSave = async function(req, res){
		try {
			if(req.session.admin){
				let slug = req.body.slug;
				slug = slug.toLowerCase();
				slug = slug.replace(' ','_');

				let inputData = {
					slug: slug,
					eng: req.body.english,
					arb: req.body.arabic,
				};

				var keyWordList = await model.Language.create(inputData);
				if(keyWordList != null){
					req.flash('success',"Keyword Successfully Added...");
					res.redirect('/admin/lang');
				}else{
					req.flash('error',"Keyword Not Add. Please Try Again...");
					res.redirect('/admin/adminaddproperty');
				}		
			} else {
				res.redirect('/admin/lang');
			}
		} catch(err){
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/lang');
		}
	};

    // [ Edit - Render ]
    module.langEdit = async function(req, res){
		try{
			if(req.session.admin){
				var keyId = req.params.id;
				var langData = await model.Language.findOne({'_id':keyId});
				if(langData){
					res.render('admin/language/editLang', {
						title: 'Edit Keyword',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						settings: settings, //Global variable
						config: config,
						alias:'language',
						langData : langData
					});
				} else {
					req.flash('error',"Keyword Details Not Found, Please Try Again");
					res.redirect('/admin/lang');
				}
			} else {
				res.redirect('/admin/lang');
			}
		} catch(err){
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/cmspages');
		}
	}
	
	// [ Edit - Update ]
	module.updateKeyword = async function(req, res){
		try {
			if(req.session.admin){
				var keyId = req.params.id;
				let slug = req.body.slug;
				let eng  = req.body.english;
				let arb  = req.body.arabic;
				
				slug = slug.toLowerCase();
				slug = slug.replace(' ','_');
				
				var Language = await model.Language.findOne({'_id':keyId});
				if(Language){
					var updateData = {
						slug : slug,
						eng  : eng,
						arb  : arb
					};
					
					var keyData = await model.Language.updateOne({'_id':keyId},updateData);
					if(keyData != null){
						req.flash('success',"Keyword successfully update");
						res.redirect('/admin/lang');
					}else{
						req.flash('error',"Keyword not update. Please try again.");
						res.redirect('/admin/lang');
					}		
				} else {
					req.flash('error',"Keyword not found. Please try again.");
					res.redirect('/admin/admineditproperty/'+keyId);
				}
			} else {
				res.redirect('/admin/lang');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/lang');
		}
	}
	
    // [ Delete ]
    module.langKeyDelete = async function(req, res){
		try{
			if(req.session.admin){
				var keyId = req.params.id;
				var Language = await model.Language.findOne({'_id':keyId});
				if(Language){
					await model.Language.deleteOne({'_id':keyId});
					req.flash('success',"Keyword delete successfully.");
					res.redirect('/admin/lang');
				} else {
					req.flash('error',"Keyword not found. Please try again.");
					res.redirect('/admin/lang');
				}
			} else {
				res.redirect('/admin/lang');
			}
		} catch(err){
			console.log('Error: ',err);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/lang');
		}
	}

	return module;
}
