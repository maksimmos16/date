var dateformat = require('dateformat');
var currentDate = new Date();

module.exports = function(model,config){	
	var module = {};

    // [ View ]
	module.view = async function(req, res) {
        try{

	        res.render('admin/transaction/view', {
				title: 'Transaction Management',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias: 'transaction',
				subAlias: 'Transaction',
			});
		} catch(error){
			console.log("transaction >> view:::::::::::::::::::::::>>>>>error: ",error);
			req.flash('error',"Transaction under maintenance.");
			res.redirect('/admin/dashboard');
		}
	}

	// [ List ]
	module.getTransactionList = async function(req, res){
		  
		let start = parseInt(req.body.start);
		let length = parseInt(req.body.length);
		let search = req.body.search.value;
		let tmpp = {};
		if(search){
			tmpp.$or = [
				{ username: new RegExp(search, "i") },
				{ planName: new RegExp(search, "i") }
			];
		}

		let columns = [
			'_id',
			'planName',
			'transactionAmount',
			'paymentType',
			'created_at',
			'status',
			'description'
		]

		let transactionCount = await model.Transaction.aggregate([
			{ $lookup:
				{
					from: 'users',
					localField: 'userId',
					foreignField: '_id',
					as: 'user_data'
				}
			},
			{ $unwind:"$user_data" },
			{ $project : { 
				username : '$user_data.username',
				profilePic : '$user_data.profilePic',
				planName: 1,
				transactionAmount: 1,
				paymentType: 1,
				created_at: 1,
				status: 1,
				description: 1,
				transactionForm: 1
			} },
			{ $match : tmpp },
			{
				$count: 'totalCount'
			}
		]);
		console.log('transactionCount: ',transactionCount);

		let data = await model.Transaction.aggregate([
			{ $lookup:
				{
					from: 'users',
					localField: 'userId',
					foreignField: '_id',
					as: 'user_data'
				}
			},
			{ $unwind:"$user_data" },
			{ $project : { 
				username : '$user_data.username',
				profilePic : '$user_data.profilePic',
				planName: 1,
				transactionAmount: 1,
				paymentType: 1,
				created_at: 1,
				status: 1,
				description: 1,
				transactionForm: 1
			} },
			{ $match : tmpp },
			{ "$sort" : { "created_at" : -1 } },
			{ "$skip": start },
			{ "$limit": length },
		]);
		
		console.log('data: ',data.length);

		var datav;
		for (let i = 0; i < data.length; i++) {
			var datenew = data[i].created_at;
			var datav = dateformat(datenew, 'dd-mm-yyyy');
		  data[i].created_at = datav; 
		}
		var obj = {
	      	'draw': req.query.draw,
	      	'recordsTotal': transactionCount[0].totalCount,
	      	'recordsFiltered': transactionCount[0].totalCount,
	      	'data': data
		};
	    return res.send(JSON.stringify(obj));
	};

	// [ View Detail ]
	module.viewDetails = async function(req, res) {
        try{	
			
			let tmp = await model.Transaction.findOne({"_id" : req.params.id});

	        res.render('admin/transaction/viewTransaction', {
				title: 'Transaction Management',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias: 'transaction',
				subAlias: 'Transaction',
				viewDetail: tmp
			});
		} catch(error){
			console.log("transaction >> view:::::::::::::::::::::::>>>>>error: ",error);
			req.flash('error',"Transaction under maintenance.");
			res.redirect('/admin/dashboard');
		}
	}

	return module;
}

