
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
			let questionsData = await model.Questions.find();
		   	res.render('admin/questions/list', {
				title: 'All Questions',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'questions',
				questionsData : questionsData
			});
		} else {
			res.redirect('/admin');
		}
	}

	module.questionList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = { $or:[ 
				        {que: { $regex: '.*' + search + '.*' }},
						{quesType:{ $regex: '.*' + search + '.*' }}
					], 'isDeleted': false };
					
			let columns = [
				'quesType',
				'que',
				'ans',
				'priorityNo',
				'status'
			]

			let countryCount = await model.Questions.countDocuments(query);
			let data = await model.Questions.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});
			
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': countryCount,
				'recordsFiltered': countryCount,
				'data': data
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in countryList",e);
        }
	}

	module.active = async function(req, res){
		try{
			if(req.session.admin){
				let queId = req.params.id;
				let queData = await model.Questions.findOne({'_id': queId});
				let flag = true;
				if(queData){
					if(queData.status == true){
						flag = false;
					}else{
						flag = true;
					}
					await model.Questions.updateOne({'_id': queId},{'status': flag});
					let fl = (flag == false) ? 'Inactive' : 'Active';
					req.flash('success',"Questions "+fl+" Successfully.");
					res.redirect('/admin/questions');
				} else {
					req.flash('error',"Questions detail not found, Please try again.");
					res.redirect('/admin/questions');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/offer');
		}
	}

	// [ Add - Form ]
	module.add = async function(req, res){
		if(req.session.admin){
			let catArr = await model.Category.find();
			console.log('catArr: ',catArr);
		   	res.render('admin/questions/add', {
				title: 'All Question',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'questions',
				questionsData : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - Page ]
	module.addQuestion = async function(req, res){
		try {
			var priorityNo = req.body.priorityNo;
			var obj = {
				'priorityNo':priorityNo,
				'isDeleted':false
			}
			var checkPriorityNo = await model.Questions.findOne(obj);
			if(checkPriorityNo){
				req.flash('error',"This Priority No is already used. Please try another...");
				return res.redirect('/admin/questions');
			}
			var ans = req.body['ans'];
			if (typeof ans == 'string') {
				ans = [ans];
			}
		
			ans = ans.map(function(data){
				return data.trim();
			});
			
			if(req.session.admin){

				var queData = await model.Questions.create({
					que: req.body.que,
					ans:ans,
					quesType: req.body.quesType,
					categoryName: req.body.categoryType,
					priorityNo: priorityNo,
					status: req.body.status, 
					isDeleted: false,
				});
				if(queData != null){
					req.flash('success',"Question Add Successfully...");
					res.redirect('/admin/questions');
				}else{
					req.flash('error',"questions Not Add. Please Try Again...");
					res.redirect('/admin/questions');
				}		
			} else {
				res.redirect('/admin/questions');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/questions');
		}
	}

	// [ Delete ]
	module.deleteQuestion = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				let tmp = await model.Questions.findOne({'_id': delId});
				if(tmp){
					// await model.Questions.deleteOne({'_id': delId});
					await model.Questions.updateOne({_id: mongoose.Types.ObjectId(delId)},{'isDeleted': true});
					req.flash('success',"Question Delete Successfully");
					res.redirect('/admin/questions');
				} else {
					req.flash('error',"Question detail not found. Please try again.");
					res.redirect('/admin/questions');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/questions');
		}
	}

	// [ Edit - Form ]
	module.editQuestion = async function(req, res){
		try{
			if(req.session.admin){
				let questionsData = await model.Questions.findOne({'_id': req.params.id});
				if(questionsData){
					res.render('admin/questions/edit', {
						title: 'Edit Question',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'questions',
						questionsData : questionsData
					});
				} else {
					req.flash('error',"Question not found. Please try again.");
					res.redirect('/admin/questions/');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/questions');
		}
	}

	// [ Edit - Page ]
	module.updateQuestionDetail = async function(req, res){
		try{
			var queId = req.params.id;
			let quedata = await model.Questions.findOne({'_id': queId});
			
			var priorityNo = req.body.priorityNo;
			var obj = {
				'priorityNo':priorityNo,
				'isDeleted':false
			}
			var checkPriorityNo = await model.Questions.findOne(obj);
			let updateno = true;

			if(checkPriorityNo){
				if(checkPriorityNo.id != quedata.id){
					if(checkPriorityNo.priorityNo == priorityNo){
						updateno = false;
					}
				} else {
					updateno = true;
				}
			}
			
			if(updateno == false){

				req.flash('error',"This Priority No is already used. Please try another...");
				return res.redirect('/admin/questions');

			} else {

				var ans = req.body['ans'];

				if (typeof ans == 'string') {
					ans = [ans];
				}
				ans = ans.filter(function(data){
					if (data && data != '') {
						return data;
					}
				});
				ans = ans.map(function(data){
					return data.trim();
				});
				
				var delId = req.params.id;
				if(req.session.admin){
					
					let tmp = await model.Questions.findOne({'_id': delId});
					if(tmp){
						var UpdatequestionsData = { 
							que: req.body.que,
							ans:ans,
							quesType: req.body.quesType,
							categoryName: req.body.categoryType,
							priorityNo: priorityNo,
							status: req.body.status, 
							isDeleted: false
						}

						await model.Questions.updateOne({_id: mongoose.Types.ObjectId(delId)},UpdatequestionsData);
						req.flash('success','Question Update Successfully');
						res.redirect('/admin/questions')
					} else {
						req.flash('error',"Question Not Found, Please Try Again");
						res.redirect('/admin/questions');
					}
				} else {
					res.redirect('/admin');
				}
			}
			
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/questions');
		}
	}

	return module;
}
