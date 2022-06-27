module.exports = function(mongoose,schema){
	var offerSchema = new schema({
                offerName     : { type : String, default: ''},
                promoCode     : { type : String, default: ''},
                offerType     : { type : String, enum:['unlimited','limited'], default: 'limited'}, 
                discount      : { type : Number, default: 0},
                startDate     : { type: Date, default: ''},
                endDate       : { type: Date, default: ''},
                perUser       : { type : Number, default: 0},
                status        : { type : Boolean, default: false },
                isDeleted     : { type : Boolean, default: false },
                createdAt     : { type : Date, default : new Date()},
		updatedAt     : { type : Date, default : new Date()} 
        	},{versionKey: false,collection: 'offer'}
	);
	var Offer = mongoose.model('offer', offerSchema);
	return Offer;
};