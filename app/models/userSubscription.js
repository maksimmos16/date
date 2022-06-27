module.exports = function(mongoose,schema){
	var userSubscriptionSchema = new schema({
                userId        : { type: schema.Types.ObjectId, default: null},
                planId        : { type: schema.Types.ObjectId, default: null},
                planType      : { type: String, default: ''},
                price	      : { type: Number, default: 0},
                isDeleted     : { type: Boolean, default: false},
                isExpired     : { type: Boolean, default: false},
                isSpecial     : { type: Boolean, default: false},
                benefits      : { type: Object, default: []},
                createdAt     : { type: Date, default: new Date()},
                expireAt      : { type: Date, default: new Date()},
        	},{versionKey: false,collection: 'userSubscription'});
	var userSubscription = mongoose.model('userSubscription', userSubscriptionSchema);
	return userSubscription;
};