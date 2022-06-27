module.exports = function(mongoose, schema) {
	var userAnswerSchema = new schema({
		queId: { type: mongoose.Types.ObjectId, default: null},
		ans: { type: String, default : ''},
		oppAns:{ type: Object, default: []},
		userId: {type: mongoose.Types.ObjectId, default: null},
		isPrivate: {type: Boolean, default: false},
		isSkipped: {type: Boolean, default: false},
		isDeleted: { type: Boolean, default: false},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	},{collection: 'userAnswers', versionKey: false});
	var UserAnswers = mongoose.model('userAnswers',userAnswerSchema);
	return UserAnswers; 
}