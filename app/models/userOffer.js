module.exports = function(mongoose,schema){
	var userOfferSchema = new schema({
                promoCode     : { type : String, default: ''},
                userId        : { type : schema.Types.ObjectId, default: null},
                isDeleted     : { type : Boolean, default: false },
                isExpire      : { type : Boolean, default: false},
                createdAt     : { type : Date, default : new Date()},
		updatedAt     : { type : Date, default : new Date()} 
        	},{versionKey: false,collection: 'userOffer'}
	);
	var UserOffer = mongoose.model('userOffer', userOfferSchema);
	return UserOffer;
};