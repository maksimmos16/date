module.exports = function(mongoose,schema){	
	var testimonialSchema = new schema({
        userId			 : { type : schema.Types.ObjectId, default: null},
        dateId  		 : { type : schema.Types.ObjectId, default: null},
        type 			 : { type : String, enum: ['date','website'], default: ''},
        text		     : { type : String, default: ''},
        isDeleted        : { type : Boolean, default: false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false, collection: 'testimonials'});
	var Testimonial = mongoose.model('testimonials', testimonialSchema);

	return Testimonial;
}