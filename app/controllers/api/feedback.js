module.exports = function(model, config) {
	var module = {};

	module.getFeedbackQuestions = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let feedbackQues = await model.Questions.find({isDeleted: false, status: true, quesType: 'feedback'},{_id:1, que:1, ans:1}).sort({priorityNo: 1});
			if (feedbackQues && feedbackQues.length) {
				successMessage.message = "Feedback questions loaded successfully";
				successMessage.data = {feedbackQuestionsList: feedbackQues};
				res.send(successMessage);
			} else {
				successMessage.message = "No questions are available";
				successMessage.data = {feedbackQuestionsList: []};
				res.send(successMessage);
			}
		} catch (e) {
			console.log('getFeedbackQuestions::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.sendFeedback = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var dateId = req.body.dateId;
			var feedbacks = req.body.feedbacks;
			var token = req.headers.token;
			var testimonials = req.body.testimonials;
			if (userId) {
				var userDetails = await model.User.findOne({_id: userId, isDeleted: false, status: 'accept', loginToken: token});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					let checkFeedbackCount = await model.Feedback.countDocuments({userId: userId, dateId: dateId, isDeleted: false});
					if (checkFeedbackCount) {
						failedMessage.message = "Feedback already sent";
						return res.send(failedMessage);
					}

					if (typeof feedbacks == 'string') {
						feedbacks = (helper.IsJsonString(feedbacks)) ?  JSON.parse(feedbacks) : [];
					}
					if (feedbacks.length) {
						let insertData = feedbacks.map(function(data) {
							data.userId = userDetails._id;
							data.dateId = mongoose.Types.ObjectId(dateId);
							data.queId = mongoose.Types.ObjectId(data.queId);
							data.createdAt = new Date();
							data.updatedAt = new Date();
							return data;
						});
						
						await model.Feedback.insertMany(insertData);
						if (testimonials) {
							let obj = {
								userId: userDetails._id,
								dateId: mongoose.Types.ObjectId(dateId),
								text: testimonials,
								type: 'date',
								createdAt: new Date(),
								updatedAt: new Date()
							}
							await model.Testimonial.create(obj);
						}
						successMessage.message = "Feedback sent successfully";
						res.send(successMessage);
					} else {
						failedMessage.message = "Please provide feedback";
						res.send(failedMessage);
					}
				} else {
					failedMessage.message = "User data not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User Id is invalid";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('sendFeedback::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}
	return module;
}