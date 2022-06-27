module.exports = function(mongoose,schema){	
	var userSchema = new schema({
		site_name     		: {type : String, default : ''},
		support_email 		: {type : String, default : ''},
		likesLimit 	  		: {type : Number, default : ''},
		privacyMediaLimit   : {type : Number, default : ''},
		support_number		: {type : String},
		site_address  		: {type : String, default: '' },
		adminId       		: {type : String, default: '' },

		verfiyIdentity		: {type : Boolean, default: false},
		leaderBoardDisplay	: {type : Number, default: '' },
		leaderBoardWinner 	: {type : Number, default: '' },
		nearByDistance		: {type : Number, default: '' },

		otpMaxTime       	: {type : Number, default: '' },
		minAge       		: {type : Number, default: '' },
		maxAge       		: {type : Number, default: '' },
		minDistance       	: {type : Number, default: '' },//km
		maxDistance       	: {type : Number, default: '' },//km
		
		coinPayment     	: { type : Boolean, default: false },
		iosPayment     		: { type : Boolean, default: false },
		stripePayment     	: { type : Boolean, default: false },
		
		createdAt		 	: { type : Date, default : new Date()},
		updatedAt 	     	: { type : Date, default : new Date()}
	},{versionKey: false});
	var Setting = mongoose.model('setting', userSchema);
	return Setting;
}
