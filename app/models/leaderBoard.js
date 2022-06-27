module.exports = function(mongoose,schema){
	var leaderBoardSchema = new schema({
                userId        : { type: schema.Types.ObjectId, default: null},
                winnerMonth   : { type: String, default: ''},
                planStatus    : { type: Boolean, default: false},
                isMailSend   : { type: Boolean, default: false},
                isDeleted     : { type: Boolean, default: false},
                createdAt     : { type: Date, default: new Date()},
                updatedAt      : { type: Date, default: new Date()},
        	},{versionKey: false,collection: 'leaderBoard'});
	var leaderBoard = mongoose.model('leaderBoard', leaderBoardSchema);
	return leaderBoard;
};