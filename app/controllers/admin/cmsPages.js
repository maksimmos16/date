
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/cmsPages/list', {
				title: 'All CMS Pages',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'cmsPages',
				cmsList : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.cmsList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {  title: { $regex: '.*' + search + '.*', $options:'i' } };
			let columns = [
				'slug',
				'title',
				'description'
			]

			let cmsCount = await model.CMSPages.countDocuments(query);
			let cmsData = await model.CMSPages.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});

			let obj = {
				'draw': req.query.draw,
				'recordsTotal': cmsCount,
				'recordsFiltered': cmsCount,
				'data': cmsData
			};
			
			res.send(obj);
		} catch (e) {
			console.log("Error in cmsList",e);
		}
	}

	// [ Add - Render ]
	module.add = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/cmsPages/add', {
				title: 'Add CMS Pages',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'cmsPages',
				cmsList : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - Page ]
	module.addPage = async function(req, res){
		try {
			if(req.session.admin){

				let image_name = "";
				let img = '';
				if(req.files != null){
					if(req.files.image){
						let images = req.files.image;
						var tempNum = helper.randomOnlyNumber(4);
						var datetime = dateFormat(new Date(),'yyyymmddHHMMss');
						image_name = datetime + tempNum + ".jpg";
						images.mv('./public/admin/images/icon/'+image_name, async function (uploadErr) {
						});
						img = image_name;
					}
				}

				let title = req.body.title;
				let description = req.body.description;
				let slug = req.body.cmsKey;
				slug = slug.toLowerCase();
				// slug = slug.split(' ').join('_');
				slug = slug.replace(/\s+/g,"_");

				let create_cms = {
					title		: title,
					slug		: slug,
					description	: description,
					image		: img
				}

				let slugExists = await model.CMSPages.findOne({slug: slug});

				if(slugExists){
					if(slugExists.slug == slug){
						req.flash('error',"CMS Key Should Be Unique.");
						res.redirect('/admin/cmsPages');
					}
				} else {
					
					let cmsPageData = await model.CMSPages.create(create_cms);
					
					if(cmsPageData != null){
						req.flash('success',"CMS Page Added Successfully.");
						res.redirect('/admin/cmsPages');
					}else{
						req.flash('error',"CMS Page Not Added, Please Try Again.");
						res.redirect('/admin/cmsPages');
					}	
				}

			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again.");
			res.redirect('/admin/cmsPages');
		}
	}

	// [ Delete - Page ]
	module.deletePage = async function(req, res){
		try{
			if(req.session.admin){
				let cmsId = req.params.id;
				let cms = await model.CMSPages.findOne({'_id': cmsId});
				if(cms){
					await model.CMSPages.deleteOne({'_id': cmsId});
					req.flash('success',"CMS Page Deleted Successfully.");
					res.redirect('/admin/cmsPages');
				} else {
					req.flash('error',"CMS Page detail not found, Please try again.");
					res.redirect('/admin/cmsPages');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/cmsPages');
		}
	}

	// [ Edit - Render ]
	module.editPageDetail = async function(req, res){
		try{
			if(req.session.admin){
				let cmsList = await model.CMSPages.findOne({'_id': req.params.id});
				console.log('id: ',req.params.id);
				console.log('cmsList: ',cmsList);
				let otherApp = (cmsList.slug == 'our_other_apps') ? true : false;
				if(cmsList){
					res.render('admin/cmsPages/edit', {
						title: 'Edit CMS Page',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						settings: settings, //Global variable
						config: config,
						alias:'cmsPages',
						cmsList : cmsList,
						otherApp: otherApp
					});
				} else {
					req.flash('error',"CMS Page detail not found, Please try again.");
					res.redirect('/admin/cmsPages/');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/cmsPages');
		}
	}

	// [ Edit - Update ]
	module.updatePageDetail = async function(req, res){
		try{
			if(req.session.admin){
				
				var cmsId = req.params.id;
				let cms = await model.CMSPages.findOne({'_id': cmsId});
				if(cms){

					let image_name = "";
					let img = '';
					if(req.files != null){
						if(req.files.image){
							let images = req.files.image;
							var tempNum = helper.randomOnlyNumber(4);
							var datetime = dateFormat(new Date(),'yyyymmddHHMMss');
							image_name = datetime + tempNum + ".jpg";
							images.mv('./public/admin/images/icon/'+image_name, async function (uploadErr) {
							});
							img = image_name;
						}
					}

					let title = req.body.title;
					let description = req.body.description;
					let slug = req.body.cmsKey;
					slug = slug.toLowerCase();
					// slug = slug.split(' ').join('_');
					slug = slug.replace(/\s+/g,"_");

					let update_cms = {
						title		: title,
						slug		: slug,
						description	: description,
						image		: img
					}

					let slugExists = await model.CMSPages.findOne({slug: slug});
					let updateCMS = true;

					if(slugExists){
						if(slugExists.id != cms.id){
							if(slugExists.slug == slug){
								updateCMS = false;
							}
						} else {
							updateCMS = true;
						}
					}
					
					if(updateCMS == false){

						req.flash('error',"CMS Key Should Be Unique.");
						res.redirect('/admin/cmsPages');

					} else {
						
						let cmsPageData = await model.CMSPages.updateMany({'_id': cmsId},update_cms);
						
						if(cmsPageData != null){
							req.flash('success',"CMS Page Updated Successfully.");
							res.redirect('/admin/cmsPages');
						}else{
							req.flash('error',"CMS Page Not Updated, Please Try Again.");
							res.redirect('/admin/cmsPages');
						}
					}

				} else {
					req.flash('error',"CMS Page Detail Not Found, Please Try Again.");
					res.redirect('/admin/cmsPages');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/cmsPages');
		}
	}

	// [ Other App ]
	module.updatePageDetailOther = async function(req, res){
		try{
			if(req.session.admin){
				
				console.log('req.body: ',req.body);
				console.log('req.files.image: ',req.files);
				var cmsId = req.params.id;
				console.log('typeof: ',typeof(req.body.appName));

				let otherApp = [];
				if(typeof(req.body.appName) == 'string'){
					let jssn = {};
					jssn.apNm = req.body.appName;
					jssn.dis = req.body.discri;
					jssn.img = '';

					if(req.files != null && req.files.image){
						let img = '';
						let images = req.files.image;
						var tempNum = helper.randomOnlyNumber(4);
						var datetime = dateFormat(new Date(),'yyyymmddHHMMss');
						image_name = datetime + tempNum + ".jpg";
						images.mv('./public/admin/images/icon/'+image_name, async function (uploadErr) {
						});
						img = image_name;
						jssn.img = img;
					}
					else {
						console.log('jssn.img: ',jssn.img);
						let tmpp = await model.CMSPages.findOne({'_id': cmsId});
						console.log('tmpp: ',tmpp);
						jssn.img = tmpp.otherApp[0].img;
					}
					console.log('jssn- string: ',jssn);
					otherApp.push(jssn);

				}
				else {

					for (var i = 0; i < req.body.appName.length; i++) {
						let jssn = {};
						jssn.apNm = req.body.appName[i];
						jssn.dis = req.body.discri[i];
						jssn.img = '';

						if(req.files != null && req.files.image[i]){
							let img = '';
							let images = req.files.image[i];
							var tempNum = helper.randomOnlyNumber(4);
							var datetime = dateFormat(new Date(),'yyyymmddHHMMss');
							image_name = datetime + tempNum + ".jpg";
							images.mv('./public/admin/images/icon/'+image_name, async function (uploadErr) {
							});
							img = image_name;
							jssn.img = img;
						}
						else {
							console.log('jssn.img: ',jssn.img);
							let tmpp = await model.CMSPages.findOne({'_id': cmsId});
							console.log('tmpp: ',tmpp);
							console.log('tmpp.otherApp[i]: ',tmpp.otherApp[i]);
							jssn.img = (tmpp.otherApp[i] == undefined) ? '' : tmpp.otherApp[i].img;
						}
						console.log('jssn: ',jssn);
						otherApp.push(jssn);
					}

				}

				console.log('otherApp: ',otherApp);

				
				let cms = await model.CMSPages.findOne({'_id': cmsId});
				let cmsPageData = '';
				let title = req.body.title;
				let description = req.body.description;
				let slug = req.body.cmsKey;
				slug = slug.toLowerCase();
				slug = slug.replace(/\s+/g,"_");

				let update_cms = {
					title		: title,
					slug		: slug,
					description	: description,
					otherApp: otherApp
				}

				console.log('update_cms: ',update_cms);

				cmsPageData = await model.CMSPages.updateOne({'_id': cmsId},update_cms);
				
				if(cmsPageData != null){
					req.flash('success',"CMS Page Updated Successfully.");
					res.redirect('/admin/cmsPages');
				}else{
					req.flash('error',"CMS Page Not Updated, Please Try Again.");
					res.redirect('/admin/cmsPages');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/cmsPages');
		}
	}

	return module;
}
