module.exports = function(mongoose,schema){	
	var amentiesSchema = new schema({
        amentiesName     : {type : String, default: null},
		placeId          : { type:schema.Types.ObjectId, default: null},
		isDeleted        : { type : Boolean, default : false},
		price			 : { type : Number, default: 0},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false});
	var Amenties = mongoose.model('amenties', amentiesSchema);
	return Amenties;
}