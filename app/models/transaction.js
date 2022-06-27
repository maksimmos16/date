module.exports = function(mongoose,schema){
	var transactionSchema = new schema({
        userId : {type:schema.Types.ObjectId,default: null},
        planId : {type:schema.Types.ObjectId, default: null},
        planName: { type:String, default:""},
        promoCode: {type: String, default: ''},
        orginalAmount: {type: Number, default: 0},
        discount: {type: Number, default: 0},
        transactionAmount : {type : Number, default : 0},
        stripeChargeId: {type:String, default:""},
        coinAddress: {type: String, default: ""},
        transactionId: { type:String, required : true, default: ""},
        paymentType: {type: String,  enum:['card','btc','bch','ltc','eth','netBank'], default: 'card'}, // type of payment through which transaction done
        bankTransactionId: { type:String, default:""},
        bankTransactionToken: {type: String, default: ""},
        status: { type:String, enum:['pending','completed','failed'],default:'pending' ,required : true},
        description: {type: String, default:''},
        transactionForm: {type: String, enum:['credit','debit','deposit','withdraw','refund'],default:''}, // is money credited or debited
        transactionType: { type:String, enum: ['plan','date'], default: 'plan'}, //
        createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
    },{versionKey: false}
    );
	var TransactionSchema = mongoose.model('transaction', transactionSchema);
	return TransactionSchema;
};