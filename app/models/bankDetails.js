module.exports = function(mongoose,schema){
	var BankDetailsSchema = new schema({
        userId : {type:schema.Types.ObjectId, ref:'user'},
		bankName : {type : String, default: ''},
		accNo : {type : String, default: ''},
		accHolder : {type : String, default: ''},
		swiftCode: {type: String, default: ''},
		shortCode: {type: String, default: ''},
		contactNumber : {type : String, default: ''},
		stripeBankId : {type : String,default:''},
		isDefault : {type : String,enum:['0','1'], default: '0' },
		createdAt: {type:Date, default: new Date()},
		updatedAt: {type:Date, default: new Date()}
	}, {versionKey: false, collection: 'bankDetails'}
	);
	var BankDetails = mongoose.model('bankDetails', BankDetailsSchema);
	return BankDetails;
};