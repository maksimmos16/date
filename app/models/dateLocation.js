module.exports = function(mongoose,schema){
	var dateLocationSchema = new schema({
                offerName     : {type : String, default: ''},
                promoCode     : {type : String, default: ''},
                offerType     : {type : String, enum:['unlimited','limited'], default: 'limited'}, 
                startDate     : {type: Date, default: ''},
                endDate       : {type: Date, default: ''},
                perUser       : {type : Number, default: 0},
                status        : { type : Boolean, default: false },
                isDeleted     : { type : Boolean, default: false },
                createdAt     : { type : Date, default : new Date()},
		updatedAt     : { type : Date, default : new Date()}
        	},{versionKey: false,collection: 'dateLocations'}
	);
	var DateLocation = mongoose.model('dateLocations', dateLocationSchema);
	return DateLocation;
};