module.exports = function(mongoose,schema){
	var CardSchema = new schema({
        userId : {type:schema.Types.ObjectId, default: null},
		cardNo : {type : String, default: ''},
		cardHolder : {type : String, default:''},
		expireDate : { type: String }, // mm/yyyy
		bankName : {type : String, default: ''},
		cardType: {type : String, default: ''},
        createdAt: {type: Date, default: new Date()},
		updatedAt: {type: Date, default: new Date()},
		isDeleted : {type: Boolean, default:false},
	},{collection:'cards',versionKey: false}
	);
	var Card = mongoose.model('cards', CardSchema);
	return Card;
};