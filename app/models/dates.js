module.exports = function(mongoose, schema) {
	var dateSchema = new schema({
		initUserId 		 : { type: schema.Types.ObjectId, default: null},
		initOppId  		 : { type: schema.Types.ObjectId, default: null},
		crtUserId  		 : { type: schema.Types.ObjectId, default: null},
		crtOppId   		 : { type: schema.Types.ObjectId, default: null},
		totalPrice 		 : { type: Number, default: 0},
		paymentStatus	 : { type: String, enum: ['pending', 'partial', 'completed' ] , default: 'pending'},
		userPaymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending'},
		oppPaymentStatus : { type: String, enum: ['pending', 'completed'], default: 'pending'},
		isApproved		 : { type: Boolean, default: false}, // is approved by user opp user
		locationId       : { type: schema.Types.ObjectId, default: null},
		location     	 : { type : { type: String }, coordinates: [] },
		locationAddress	 : { type: String, default: ''},
		dateAttemptCount : { type: Number, default: 0}, //counter for suggestion for dates max to 3
		dateTime   		 : { type: Date, default: new Date()}, 
		status           : { type: String, enum:['pending', 'completed', 'cancelled'], default: 'pending'},
		createdAt  		 : { type: Date, default: new Date()},
		updatedAt  		 : { type: Date, default: new Date()}
	},{collection: 'dates', versionKey: false});

	dateSchema.virtual('senderData', {
		ref: 'users',
		localField: 'initUserId',
		foreignField: '_id',
		justOne: true
	});

	dateSchema.virtual('receiverData', {
		ref: 'users',
		localField: 'initOppId',
		foreignField: '_id',
		justOne: true
	});	

	dateSchema.virtual('feedback', {
		ref: 'feedbacks',
		localField: '_id',
		foreignField: 'dateId',
		justOne: false
	});
	dateSchema.set('toJSON', {virtuals: true});
	dateSchema.set('toObject', {virtuals: true});

	var Dates = mongoose.model('dates', dateSchema);
	return Dates; 
}