module.exports = function(mongoose,schema){
	var subscriptionSchema = new schema({
                planName      : { type : String, default: ''},
                planType      : { type : String, enum:['premium','getlist','getboost'], default: ''},
                discount      : { type : Number, default: 0}, 
                price         : { type : Number, default: 0},
                benefits      : { type : Object, default: {}},
                status        : { type : Boolean, default: false },
                duration      : { type : Number, default: 0},
                durationType  : { type : String, enum:['monthly','yearly','none'], default: 'none'},
                createdAt     : { type : Date, default : new Date()},
		updatedAt     : { type : Date, default : new Date()},
                isDeleted     : { type: Boolean, default: false}, 
        	},{versionKey: false,collection: 'subscriptions'});
	var subscription = mongoose.model('subscriptions', subscriptionSchema);
	return subscription;
};