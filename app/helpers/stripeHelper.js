var xlsx = require('node-xlsx').default;
var fs = require('fs');
var FCM = require('fcm-node');
var requestM = require('request');
var config = require('../../config/constants.js');
const nodemailer = require("nodemailer");
const moment = require("moment");
const stripe = require("stripe")(config.stripeSecretKey, {apiVersion: '2019-05-16'});

module.exports.createAccount  = async function(model,data){
	console.log('createAccount----------->>>data: ',data);
	return new Promise(resolve => {
		let obj = {
		  	type: 'custom',
		  	country: 'GB',
		  	business_type:"individual",
		  	email: data.email,
		  	individual:data.individual,
		  	tos_acceptance: {
				date: Math.floor(Date.now() / 1000),
				ip: data.remoteAddress // Assumes you're not using a proxy
		    }
		}
		stripe.accounts.create(obj,async function(err, account) {
			if(err){
				console.log("createAccount-------------->>>>err: ",err);
				resolve({status:"fail","message":err.message});
			} else{		
				await model.User.updateOne({"_id":data.userId},{"stripeAccountId":account.id})	  	
				resolve({status:"success","data":account});
			}
		});
	}); 
}

module.exports.updateAccount  = async function(data){	
	console.log('updateAccount-------------->>>>data: ',data);
	return new Promise(resolve => {
		let obj = {			  
			business_type:"individual",
		  	metadata: {internal_id: '42'},
		  	individual : data.individual,
		  	tos_acceptance: {
				date: Math.floor(Date.now() / 1000),
				ip: data.remoteAddress 
		  	}
		};
		stripe.accounts.update(data.stripeAccountId,obj).then(function(acct) {
			// console.log("updateAccount---------->>>acct: ",acct);
			resolve({status:"success",message:"",data:acct});
		}).catch(function(err) {
			console.log('updateAccount:::::::::::>>>>err: ',err);
			resolve({status: "fail", message:err.message, data: err})
		});
	});
}

module.exports.createExternalBankAccount  = async function(model,data){
	return new Promise(resolve => {
		stripe.accounts.createExternalAccount(data.stripeAccountId,{
		    	external_account:data.bank_detail,
		    },async function(err, bank_account) {
			    if(err){
				  	console.log("createExternalBankAccount------------>>>>err: ",err);
				  	resolve({status:"fail",message:err.message});
				} else{
				  	if(data.bank_id != undefined && data.bank_id!=''){
				  		await model.BankDetails.updateOne({_id:data.bank_id},{'stripe_bank_id':bank_account.id});
				  	}
				  	resolve({status:"success",message:"Bank account create",data:bank_account});
				}
		  	}
		);
	});
}

module.exports.uploadDoc  = async function(fileData){	
	var fp = fs.readFileSync(fileData.path);
	return new Promise(resolve => {

		stripe.files.create({
			purpose: 'identity_document',
			file: {
			    data: fp,
			    name: 'file.jpg',
			    type: 'application/octet-stream'
			}
		}, async function(err, file) {	  	
		  	if(err){
		  		// console.log("uploadDoc--------->>>err: ",err)
		  		resolve({status:'fail','message':err.message});
		  	} else{
		  		// console.log("uploadDoc--------->>>>file: ",file);
		  		resolve({status:'success','message':"",data:file});
		  	}
		});
	});
}

module.exports.createExternalCard  = async function(model,data,callback){	

	await stripe.tokens.create({
	  card: {
	    number: data.card_detail.number,
	    exp_month: data.card_detail.exp_month,
	    exp_year: data.card_detail.exp_year,
	    cvc: data.card_detail.cvc,
	    currency:data.card_detail.currency
	  }
	},async function(err, token) {
	   	if(err){
	   		console.log("Error With checking :::::",err);
		  	callback({status:"fail",message:err.message})
	   	}else{
	   		console.log("token",token);
   			var stripeData = await stripe.accounts.createExternalAccount(data.stripeAccountId,{
		    	external_account:token.id,
		    	default_for_currency:true,
		  		},async function(err, card) {
					if(err){
						console.log("Error With checking :::::",err);
						callback({status:"fail",message:err.message})
					}else{
						console.log("Account create :::::",card);
						if(data.bank_id!=undefined && data.bank_id!=''){
							// await model.BankDetails.updateOne({_id:data.bank_id},{'stripe_bank_id':bank_account.id});
						}
						callback({status:"success",message:"Bank account create",data:card})
					}
			  	}
			);
	   	}
	});
}

module.exports.createIntent = async function (amount, currency, metaData) {
	let paymentIntent = await stripe.paymentIntents.create({
		amount: amount,
		currency: currency,
		payment_method_types: ['card'],
		capture_method: 'manual'
	})
	return paymentIntent;
}

module.exports.confirmPaytent  = async function(model,data,callback){

	
	var stripeData = await stripe.paymentIntents.confirm(data.stripe_charge_id, 
			{payment_method: ''},async function(err, intent) {
				
		if(err){
		  	console.log("Error With checking :::::",err);
		  	callback({status:"fail",error:err})
	  	}else{
		  	console.log("intent_data:::::::",intent);
		  	callback({status:"success",message:"Bank account create",data:intent})
	  	}
	});
}

module.exports.cancelPaytent  = async function(model,data,callback){

	if(data.stripe_charge_id.charAt(0) == 'c'){
		stripe_helper.cancelTransaction(model,data, function(response){
			callback({status:"success",message:"Payment refund success",data:response})
		});
	}else{
		var stripeData = await stripe.paymentIntents.cancel(data.stripe_charge_id, async function(err, intent) {
			if(err){

				CronCancel.log({
			        level: 'error',
			        time: "Stripe_Helper_cancelPaytent_Error_"+moment().format("YYYY-MM-DD HH:mm:ss"),
			        message: {'Stripe_Helper_cancelPaytent_Error_':err}
			    });

			  	console.log("Error With checking :::::",err);
			  	callback({status:"fail",error:err})
		  	}else{
			  	console.log("intent_data:::::::",intent);
			  	callback({status:"success",message:"Bank account create",data:intent})
		  	}
		});
	}
}

module.exports.createPayout  = async function(data){

	return new Promise(resolve => {
		let obj = {
			amount: parseInt(data.amount * 100),
			currency: data.currency
		};
		stripe.payouts.create(obj,{stripe_account: data.stripeAccountId},function(err, bank_account) {
		      	if(err){
				  	console.log("createPayout---------------->>>>err: ",err);
				  	resolve({status:"fail",message: "Something went wrong",error:err});
			  	} else{
				  	resolve({status:"success",message:"Bank account create",data:bank_account});
			  	}
		  	}
		);	
	});
}

module.exports.createTransfer  = async function(data){

	return new Promise(resolve => {
		let obj = {
		  amount: parseInt(data.amount*100),
		  currency: data.currency,
		  country: data.country,
		  destination: data.stripeAccountId,
		  transfer_group: "PAYOUT_"+new Date("YYYY-MM-DD")
		}

		stripe.transfers.create(obj,async function(err, bank_account) {
		      	if(err){
				  	console.log("createTransfer---------->>>>>Error: ",err);
				  	resolve({status:"fail",message: "Something went wrong, please try again",error:err});
			  	}else{
				  	resolve({status:"success",message:"Bank account create",data:bank_account});
			  	}
		  	}
		);
	});
}

module.exports.cancelTransaction  = async function(model,data,callback){

	var stripeData = stripe.refunds.create({charge: data.stripe_charge_id}, async function(err, refund) {
	  	if(err){

	  		CronCancel.log({
		        level: 'error',
		        time: "Stripe_Helper_cancelTransaction_Error_"+moment().format("YYYY-MM-DD HH:mm:ss"),
		        message: {'Stripe_Helper_cancelTransaction_Charge_Error_':err}
		    });

		  	console.log("Error With checking :::::",err);
		  	callback({status:"fail",error:err})
	  	}else{
		  	
		  	callback({status:"success",message:"Refund charge id",data:refund});
	  	}
	});
}

module.exports.addStripeBankAccountManually = async function(model){
	var bankList = await model.BankDetails.find({'is_default':'0'});
	//console.log("bankList: ", bankList);
	var bankNotDefault = [];
	var bankNoOne = [];
	var addBankUser = ['5d7b7f9a339e211743a7a890','5d7b7dfb339e211743a7a6df'];
	for(var i=0; i<bankList.length; i++){

		if(bankList[i].user_id == '5d7b7f9a339e211743a7a890' || bankList[i].user_id == '5d7b7dfb339e211743a7a6df'){

			bankNotDefault.push(bankList[i].user_id);

			var userBankCount = await model.BankDetails.countDocuments({'user_id':bankList[i].user_id});
			if(userBankCount == 1){
				
				var userDetail = await model.User.findById(bankList[i].user_id);
				if(userDetail != null){

					var bankDetail = bankList[i];
					var data = {
						bank_detail:{
							object:"bank_account",
							country:"GB",
							currency:"GBP",
							account_holder_name:bankDetail.acc_holder_name,
							account_holder_type:"individual",
							routing_number:bankDetail.short_code,
							account_number:bankDetail.acc_number,
						},
				  		user_id:userDetail.id,
				  		stripe_acc_id: userDetail.stripeAccountId,
				  		bank_id:""	  		
					}
					console.log("Stripe Create Account::",data);
				}

			}
		}
	}
}
module.exports.captureAmountStripe  = async function(stripeChargeId, amount){	
	console.log("captureAmountStripe----------->>>>stripeChargeId: "+stripeChargeId+' amount: '+amount);
	var total_amount = (amount*1);
	return new Promise((resolve) => {

		// return resolve({"status":"success","message":"Capture test Data Successfully.",data:total_amount}); // temperory always true case until full integration is done

		var obj = {};
		if (total_amount != "" && parseFloat(total_amount) > 0) {
			obj = {amount: total_amount};
		}

		if(stripeChargeId.charAt(0) == 'c') { // stripe charge
			stripe.charges.capture(stripeChargeId,obj, async function(err, charge) {
				console.log("captureAmountStripe-----charges---->>>>error: ", err);
			  	if(err){
					resolve({"status":"fail","message":err.message,data:err});
			  	}else{
					resolve({"status":"success","message":"Capture Data Successfully.",data:charge})
			  	}
			});
		} else{
			stripe.paymentIntents.capture(stripeChargeId,obj,async function(err, charge) {
				console.log("captureAmountStripe---------pi-------->>>>error: ", err);
			  	if(err){
					resolve({"status":"fail","message":err.message,data:err});
			  	}else{
					resolve({"status":"success","message":"Capture Data Successfully.",data:charge});
			  	}
			});
		}
	})
};

module.exports.createCharge = async function(amount, currency, source, capture) {

	return new Promise((resolve) => {

		stripe.charges.create({
			amount: amount,
			currency: currency,
			source: source,
			capture: capture
		}, function(err, charge) {
			if (err) {
				resolve({status: 'fail',message: err.message, data: err}); 
			} else {
				resolve({status: 'success',message: 'Charge created successfully', data: charge});
			}
		});
	})
}