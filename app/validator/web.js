var md5 = require('md5');
module.exports = function(model){
	var module = {};

	
	module.addAnswer = function(req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('queId', 'Questions ID is required').notEmpty();

		let isSkipped = req.body.isSkipped;
		isSkipped = (isSkipped && isSkipped == '1') ? true : false;
		if (!isSkipped) {
			req.checkBody('ans', 'Answer is required').notEmpty();
			req.checkBody('oppAns', 'Opponent answer is required').notEmpty();
		}

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			let oppAns = req.body.oppAns;

			oppAns = oppAns.split(',');
			if (oppAns.length) {
				next();
			} else {
				res.send({status: 'fail', message: 'Please select opponent answer', data: {}});
			}
		}
	}
	

	
	module.viewAnswer = function(req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('queId', 'Questions ID is required').notEmpty();

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			next();
		}
	}
	

	module.sendCardDetails = function (req, res, next) {
		console.log('sendCardDetails---------->>>req.body: ',req.body);
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('planId', 'Plan Id is required').notEmpty();
		req.checkBody('cardNo', 'Card number is required').notEmpty();
		req.checkBody('cardHolder', 'Card holder name is required').notEmpty();
		req.checkBody('expMonth', 'Month of expiration is required').notEmpty();
		req.checkBody('expYear', 'Year of expiration is required').notEmpty();
		req.checkBody('cvv', 'CVV is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}
	}

	module.sendBankDetails = function (req, res, next) {
		console.log('sendBankDetails---------->>>req.body: ',req.body);
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('paymentId', 'Payment Id is required').notEmpty();
		req.checkBody('bankName', 'Bank name is required').notEmpty();
		req.checkBody('swiftCode', 'Swift code is required').notEmpty();
		req.checkBody('accNo', 'Account number is required').notEmpty();
		req.checkBody('accHolder', 'Account holder name is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}
	}

	return module;	
}