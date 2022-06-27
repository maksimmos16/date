var _ = require('underscore');
module.exports = function (model, config) {
  var module = {}
  var setSubscription = async (userId, paymentId, type, redirectToHome) => {
    let username = ''
    let email = ''
    let uBenefits = {}
    const userDetails = await model.User.findOne({ _id: userId }, { username: 1, email: 1, benefits: 1 }).lean()

    if (userDetails) {
      username = userDetails.username
      email = userDetails.email
      uBenefits = (userDetails.benefits) ? userDetails.benefits : {}
    }

    if (type == 'date') {
      const paymentDetails = await model.Dates.findOne({ _id: paymentId })
      if (paymentDetails) {
        const upData = {
          updatedAt: new Date()
        }
        if (paymentDetails.initUserId.toString() == userId.toString()) {
          upData.userPaymentStatus = 'completed'

          if (paymentDetail.oppPaymentStatus == 'completed') {
            upData.paymentStatus = 'completed'
          } else {
            upData.paymentStatus = 'partial'
          }
        } else if (paymentDetails.initOppId.toString() == userId.toString()) {
          upData.oppPaymentStatus = 'completed'

          if (paymentDetail.userPaymentStatus == 'completed') {
            upData.paymentStatus = 'completed'
          } else {
            upData.paymentStatus = 'partial'
          }
        }
        await model.Dates.updateOne({ _id: paymentDetails._id }, upData)
        if (redirectToHome) {
          try {
            const userData = await model.User.findOne({ _id: userId }, { socketId: 1 })
            if (userData && userData.socketId) {
              const client = io.sockets.connected[userData.socketId].emit('redirectToHome', { status: 'success', message: 'Payment successful', data: {} })
            }
          } catch (e) {
            console.log('setSubscription::::::::::::>>>>e: ', e)
          }
        }

        // Notification logic: start
        const oppId = (userDetails._id.toString() == paymentDetails.initUserId.toString()) ? paymentDetails.initOppId : paymentDetails.initUserId
        const notiData = {
          senderId: userDetails._id,
          receiverId: oppId,
          type: 'date',
          text: 'Payment done for the date',
          contentId: paymentDetails._id
        }
        await model.UserNotification.create(notiData)
        helper.sendNotiCount(model, userDetails._id)
        // Notification logic: end
      }
    } else {
      const paymentDetails = await model.Subscription.findOne({ _id: paymentId })
      if (paymentDetails) {
        const duration = paymentDetails.duration
        const durationType = paymentDetails.durationType
        let expireAt = ''
        const dt = new Date()
        if (duration && durationType && durationType != 'none') {
          let totalDuration = 0
          if (durationType == 'monthly') {
            totalDuration = duration * 30
          } else if (durationType == 'yearly') {
            totalDuration = duration * 365
          }

          dt.setTime(dt.getTime() + totalDuration * 86400000)
          expireAt = dt
        }

        const benefits = paymentDetails.benefits
        const benefitsArray = Object.keys(benefits)

        let subBenefits = []
        for (let i = 0; i < benefitsArray.length; i++) {
          if (benefits[benefitsArray[i]]) {
            subBenefits.push(benefitsArray[i])
          }
        }

        const newData = {
          userId: userId,
          planId: paymentDetails._id,
          planType: paymentDetails.planType,
          price: paymentDetails.price,
          benefits: subBenefits,
          createdAt: new Date(),
          expireAt: expireAt
        }
        await model.UserSubscription.create(newData) // add entry for user subscription

        if (benefits.viewMatchedDaters) {
          uBenefits.viewMatchedDaters = benefits.viewMatchedDaters
        }
        if (benefits.chatWithDaters) {
          uBenefits.chatWithDaters = benefits.chatWithDaters
        }
        if (benefits.videoChat) {
          uBenefits.videoChat = benefits.videoChat
        }
        if (benefits.privacyMode) {
          uBenefits.privacyMode = benefits.privacyMode
        }
        if (benefits.offAds) {
          uBenefits.offAds = benefits.offAds
        }
        if (benefits.boostMonth) {
          uBenefits.boostMonth = benefits.boostMonth
        }
        if (benefits.unlimitedLikes) {
          uBenefits.unlimitedLikes = benefits.unlimitedLikes
        }
        if (benefits.increaseLikes) {
          uBenefits.increaseLikes = benefits.increaseLikes
        }
        if (benefits.seeMorePeople) {
          uBenefits.seeMorePeople = benefits.seeMorePeople
        }
        if (benefits.seeAllQueAns) {
          uBenefits.seeAllQueAns = benefits.seeAllQueAns
        }
        if (benefits.seeAllBasicFeatures) {
          uBenefits.seeAllBasicFeatures = benefits.seeAllBasicFeatures
        }
        if (benefits.increaseLikesUpto) {
          uBenefits.increaseLikesUpto = benefits.increaseLikesUpto
        }
        if (benefits.enableRewind) {
          uBenefits.enableRewind = benefits.enableRewind
        }

        console.log('setSubscription------->>>>uBenefits: ', uBenefits)

        const upData = {
          benefits: uBenefits,
          updatedAt: new Date()
        }
        await model.User.updateOne({ _id: userId }, upData) // enable the subscriptions benifits

        // Mail Sent: Start

        if (email) {
          subBenefits = subBenefits.map(function (item) {
			            switch (item) {
			                case 'viewMatchedDaters': item = 'View Matched Daters'; break
			                case 'chatWithDaters': item = 'Chat With Daters'; break
			                case 'videoChat': item = 'Can Do Video Chat'; break
			                case 'privacyMode': item = 'Privacy Mode Available'; break
                      case 'offAds': item = 'Turn Off the Ads'; break
			                case 'boostMonth': item = 'Boost Month'; break
                      case 'unlimitedLikes': item = 'Unlimited Likes'; break
                      case 'increaseLikes': item = 'Increase Likes'; break
			                case 'increaseLikesUpto': item = 'Increase Likes Upto'; break
			                case 'seeMorePeople': item = 'See More Features'; break
			                case 'seeAllQueAns': item = 'See All Questions & Answers'; break
			                case 'seeAllBasicFeatures': item = 'All Alist Basic Available'; break
			                case 'enableRewind': item = 'Enable Rewind'; break
			            }
			            return item
			        })

          let duration = paymentDetails.duration
          let durationType = paymentDetails.durationType
          const planType = paymentDetails.planType
          const price = paymentDetails.price
          durationType = (durationType == 'monthly') ? 'Month' : 'Year'
          durationType = (duration = 1) ? durationType : durationType + 's'

          const plan = duration + ' ' + durationType + ' ' + planType
          var dataToReplace = {
            uname: username,
			            msg: 'Here is the payment receipt for your subscription',
			            benefits: subBenefits,
			            plan: plan,
			            price: '$' + price,
			            appStoreLink: config.appStoreLink,
			            playStoreLink: config.playStoreLink
          }
          const mailOptions = {
            to_email: email,
            subject: 'Easy Date : Payment Receipt',
            templateName: 'subscription_receipt',
            dataToReplace: dataToReplace// <json containing data to be replaced in template>
          }
          const send = await helper.sendTemplateMail(mailOptions)
        }
        // Mail Sent: End

        if (redirectToHome) {
          try {
            const userData = await model.User.findOne({ _id: userId }, { socketId: 1 })
            if (userData && userData.socketId) {
              const client = io.sockets.connected[userData.socketId].emit('redirectToHome', { status: 'success', message: 'Payment successful', data: {} })
            }
          } catch (e) {
            console.log('setSubscription::::::::::::>>>>e: ', e)
          }
        }
      }
    }
  }

  var setSubscription_old = async (userId, paymentId, type, redirectToHome) => {
    let username = ''
    let email = ''
    let uBenefits = {}
    const userDetails = await model.User.findOne({ _id: userId }, { username: 1, email: 1, benefits: 1 }).lean()

    if (userDetails) {
      username = userDetails.username
      email = userDetails.email
      uBenefits = (userDetails.benefits) ? userDetails.benefits : {}
    }

    if (type == 'date') {
      const paymentDetails = await model.Dates.findOne({ _id: paymentId })
      if (paymentDetails) {
        const upData = {
          updatedAt: new Date()
        }
        if (paymentDetails.initUserId.toString() == userId.toString()) {
          upData.userPaymentStatus = 'completed'

          if (paymentDetail.oppPaymentStatus == 'completed') {
            upData.paymentStatus = 'completed'
          } else {
            upData.paymentStatus = 'partial'
          }
        } else if (paymentDetails.initOppId.toString() == userId.toString()) {
          upData.oppPaymentStatus = 'completed'

          if (paymentDetail.userPaymentStatus == 'completed') {
            upData.paymentStatus = 'completed'
          } else {
            upData.paymentStatus = 'partial'
          }
        }
        await model.Dates.updateOne({ _id: paymentDetails._id }, upData)
        if (redirectToHome) {
          try {
            const userData = await model.User.findOne({ _id: userId }, { socketId: 1 })
            if (userData && userData.socketId) {
              const client = io.sockets.connected[userData.socketId].emit('redirectToHome', { status: 'success', message: 'Payment successful', data: {} })
            }
          } catch (e) {
            console.log('setSubscription::::::::::::>>>>e: ', e)
          }
        }

        // Notification logic: start
        const oppId = (userDetails._id.toString() == paymentDetails.initUserId.toString()) ? paymentDetails.initOppId : paymentDetails.initUserId
        const notiData = {
          senderId: userDetails._id,
          receiverId: oppId,
          type: 'date',
          text: 'Payment done for the date',
          contentId: paymentDetails._id
        }
        await model.UserNotification.create(notiData)
        helper.sendNotiCount(model, userDetails._id)
        // Notification logic: end
      }
    } else {
      const paymentDetails = await model.Subscription.findOne({ _id: paymentId })
      if (paymentDetails) {
        const duration = paymentDetails.duration
        const durationType = paymentDetails.durationType
        let expireAt = ''
        const dt = new Date()
        if (duration && durationType && durationType != 'none') {
          let totalDuration = 0
          if (durationType == 'monthly') {
            totalDuration = duration * 30
          } else if (durationType == 'yearly') {
            totalDuration = duration * 365
          }

          dt.setTime(dt.getTime() + totalDuration * 86400000)
          expireAt = dt
        }

        const benefits = paymentDetails.benefits
        const benefitsArray = Object.keys(benefits)

        let subBenefits = []
        for (let i = 0; i < benefitsArray.length; i++) {
          if (benefits[benefitsArray[i]]) {
            subBenefits.push(benefitsArray[i])
          }
        }

        const newData = {
          userId: userId,
          planId: paymentDetails._id,
          planType: paymentDetails.planType,
          price: paymentDetails.price,
          benefits: subBenefits,
          createdAt: new Date(),
          expireAt: expireAt
        }
        await model.UserSubscription.create(newData) // add entry for user subscription

        if (benefits.viewMatchedDaters) {
          uBenefits.viewMatchedDaters = benefits.viewMatchedDaters
        }
        if (benefits.chatWithDaters) {
          uBenefits.chatWithDaters = benefits.chatWithDaters
        }
        if (benefits.canDoVideoChat) {
          uBenefits.canDoVideoChat = benefits.canDoVideoChat
        }
        if (benefits.privacyEnabled) {
          uBenefits.privacyEnabled = benefits.privacyEnabled
        }
        if (benefits.turnOffAds) {
          uBenefits.turnOffAds = benefits.turnOffAds
        }
        if (benefits.unlimitedLikes) {
          uBenefits.unlimitedLikes = benefits.unlimitedLikes
        }
        if (benefits.seeMorePeople) {
          uBenefits.seeMorePeople = benefits.seeMorePeople
        }
        if (benefits.seeAllQueAns) {
          uBenefits.seeAllQueAns = benefits.seeAllQueAns
        }
        if (benefits.allAlistBasic) {
          uBenefits.allAlistBasic = benefits.allAlistBasic
        }

        console.log('setSubscription------->>>>uBenefits: ', uBenefits)

        const upData = {
          benefits: uBenefits,
          updatedAt: new Date()
        }
        await model.User.updateOne({ _id: userId }, upData) // enable the subscriptions benifits

        // Mail Sent: Start

        if (email) {
          subBenefits = subBenefits.map(function (item) {
                  switch (item) {
                      case 'viewMatchedDaters': item = 'View Matched Daters'; break
                      case 'chatWithDaters': item = 'Chat With Daters'; break
                      case 'canDoVideoChat': item = 'Can Do Video Chat'; break
                      case 'privacyEnabled': item = 'Privacy Mode Available'; break
                      case 'turnOffAds': item = 'Turn Off the Ads'; break
                      case 'unlimitedLikes': item = 'Unlimited Likes'; break
                      case 'seeMorePeople': item = 'See More Features'; break
                      case 'seeAllQueAns': item = 'See All Questions & Answers'; break
                      case 'allAlistBasic': item = 'All Alist Basic Available'; break
                      case 'increaseLikes': item = 'Increase Likes'; break
                  }
                  return item
              })

          let duration = paymentDetails.duration
          let durationType = paymentDetails.durationType
          const planType = paymentDetails.planType
          const price = paymentDetails.price
          durationType = (durationType == 'monthly') ? 'Month' : 'Year'
          durationType = (duration = 1) ? durationType : durationType + 's'

          const plan = duration + ' ' + durationType + ' ' + planType
          var dataToReplace = {
            uname: username,
                  msg: 'Here is the payment receipt for your subscription',
                  benefits: subBenefits,
                  plan: plan,
                  price: '$' + price,
                  appStoreLink: config.appStoreLink,
                  playStoreLink: config.playStoreLink
          }
          const mailOptions = {
            to_email: email,
            subject: 'Easy Date : Payment Receipt',
            templateName: 'subscription_receipt',
            dataToReplace: dataToReplace// <json containing data to be replaced in template>
          }
          const send = await helper.sendTemplateMail(mailOptions)
        }
        // Mail Sent: End

        if (redirectToHome) {
          try {
            const userData = await model.User.findOne({ _id: userId }, { socketId: 1 })
            if (userData && userData.socketId) {
              const client = io.sockets.connected[userData.socketId].emit('redirectToHome', { status: 'success', message: 'Payment successful', data: {} })
            }
          } catch (e) {
            console.log('setSubscription::::::::::::>>>>e: ', e)
          }
        }
      }
    }
  }

  module.getSubscription = async (req, res) => {
    var successMessage = { status: 'success', message: '', data: {} }
    var failedMessage = { status: 'fail', message: '', data: {} }
    try {
      var userId = req.body.userId
      var userDetail = await model.User.findOne({ _id: userId, isDeleted: false, isVerified: true, role: 'user' })
      if (userDetail) {
        var mainQuery = [
				    {
				        $match: {
			                isDeleted: false,
			                status: true
				        }
				    },
				    {
				        $sort: { durtionType: -1, duration: -1 }
				    },
				    {
            $addFields: {
						    sortOrder: {
						        $switch: {
						            branches: [
                    {
										    case: { $eq: ['$planType', 'premium'] },
										    then: 1
                    },
                    {
										    case: { $eq: ['$planType', 'getlist'] },
										    then: 2
                    },
                    {
										    case: { $eq: ['$planType', 'getboost'] },
										    then: 3
                    }
						            ],
						            default: 100
						        }
						    }
            }
				    },
				    {
				        $group: {
			                _id: '$planType',
			                planType: { $first: '$planType' },
			                benefits: { $first: '$benefits' },
			                sortOrder: { $first: '$sortOrder' },
			                details: {
			                	$push: {
			                		_id: '$_id',
		                            planName: '$planName',
		                            price: '$price',
		                            duration: '$duration',
		                            durationType: '$durationType'
			                    }
			                }
				        }
				    },
				    {
				        $sort: { sortOrder: 1 }
			        },
				    {
			            $project: { _id: 0, sortOrder: 0 }
				    }
        ]
        const subDetails = await model.Subscription.aggregate(mainQuery)
        if (subDetails) {
          for (let i = 0; i < subDetails.length; i++) {
            if (subDetails[i].benefits) {
              const tmp = Object.keys(subDetails[i].benefits)
              if (tmp.length == 0) {
                subDetails[i].benefits = []
              } else {
                const tmpArr = []
                for (let j = 0; j < tmp.length; j++) {
                  if (subDetails[i].benefits[tmp[j]]) {
                    tmpArr.push(tmp[j])
                  }
                }
                subDetails[i].benefits = tmpArr
              }
            } else {
              subDetails[i].benefits = []
            }
          }

          successMessage.message = 'Plan Full Detail'
          successMessage.data = { subDetails: subDetails }
          return res.send(successMessage)
        } else {
          failedMessage.message = 'Not Getting Plan. Please Try Again.'
          return res.send(failedMessage)
        }
      } else {
        failedMessage.message = 'user detail not found'
        return res.send(failedMessage)
      }
    } catch (error) {
      console.log('getSubscription:::::::::::>>>>error: ', error)
      failedMessage.message = 'Something Went Wrong, Please Try Again.'
      return res.send(failedMessage)
    }
  }

  module.activateSubscription = async (req, res) => {
    var successMessage = { status: 'success', message: '', data: {} }
    var failedMessage = { status: 'fail', message: '', data: {} }
    try {
      var userId = req.body.userId
      var token = req.headers.token
      var paymentId = req.body.paymentId
      var stripeChargeId = req.body.stripeChargeId
      var paymentType = req.body.paymentType
      var accountId = req.body.accountId
      var plaidPublicToken = req.body.plaidPublicToken
      var promoCode = req.body.promoCode ? req.body.promoCode : ''

      var type = req.body.type ? req.body.type : 'plan'
      var userDetail = await model.User.findOne({ _id: userId, isDeleted: false, loginToken: token, isVerified: true, role: 'user' })
      if (userDetail) {
        if (!userDetail.isActive) {
          failedMessage.message = 'You have been blocked by admin'
          return res.send(failedMessage)
        }

        paymentDetail = null

        if (type == 'date') {
          paymentDetail = await model.Dates.findOne({ _id: paymentId, status: 'pending', paymentStatus: { $ne: 'completed' }, isApproved: true }).lean()
          paymentDetail.price = paymentDetail.totalPrice / 2
        } else {
          paymentDetail = await model.Subscription.findOne({ _id: paymentId, isDeleted: false, status: true }).lean()
        }

        if (paymentDetail) {
          const originalPrice = paymentDetail.price
          // conditions for promocode
          let discountPer = 0
          let discountAmt = 0
          if (promoCode) {
            const promoQuery = {
              $and: [
                {
                  promoCode: promoCode
                }, {
                  isDeleted: false
                }, {
                  perUser: { $gt: 0 }
                }, {
                  $or:
									[
									  {
									    offerType: 'unlimited'
									  }, {
									    offerType: 'limited',
									    startDate: { $lt: new Date() },
									    endDate: { $gt: new Date() }
									  }
									]
                }
              ]
            }
            const promoCodeDetails = await model.Offer.findOne(promoQuery)
            if (promoCodeDetails) {
              discountPer = promoCodeDetails.discount
            }

            const checkOffer = await model.Offer.updateOne({ promoCode: promoCode, perUser: { $gt: 0 } }, { $inc: { perUser: -1 } })
            if (checkOffer && checkOffer.nModified) {
              const promoCodeObj = {
				                promoCode: promoCode,
				                userId: userDetail._id,
				                isDeleted: false,
				                isExpire: false,
				                createdAt: new Date(),
                updatedAt: new Date()
				        	}
              await model.UserOffer.create(promoCodeObj)
              if (discountPer) {
                discountAmt = paymentDetail.price * discountPer * 0.01
                paymentDetail.price -= discountAmt
              }
            }
          }
          console.log('activateSubscription------------>>>>paymentDetail.price: ', paymentDetail.price, ' discountAmt: ', discountAmt)

          let userSubData = 0
          if (type == 'date') {
            if (userId.toString() == paymentDetail.initUserId.toString() && paymentDetail.userPaymentStatus == 'completed') {
              userSubData = 1
            }
            if (userId.toString() == paymentDetail.initOppId.toString() && paymentDetail.oppPaymentStatus == 'completed') {
              userSubData = 1
            }
          } else if (type == 'plan') {
            userSubData = await model.UserSubscription.countDocuments({ userId: userDetail._id, planType: paymentDetail.planType, expireAt: { $gte: new Date() }, isDeleted: false })
          } else {
            userSubData = 0
          }
          if (userSubData) {
            if (type == 'date') {
              failedMessage.message = 'Payment already done for this date'
            } else {
              failedMessage.message = 'Subscription plan with same type is already activated'
            }
            res.send(failedMessage)
          } else {
            let paymentResp = null
            if (paymentType == 'card') {
              paymentResp = await stripeHelper.captureAmountStripe(stripeChargeId, paymentDetail.price)
              if (paymentResp && paymentResp.status == 'success') {
                setSubscription(userId, paymentId, type, false)
                const transactionId = helper.generateTransactionId(15) // helper.randomNumber(6)+moment().format('hmmss');
                const obj = {
                  stripeChargeId: stripeChargeId,
                  status: 'completed',
                  updatedAt: new Date(),
                  $setOnInsert: {
                    userId: userDetail._id,
                    planId: paymentDetail._id,
                    planName: paymentDetail.planName,
                    promoCode: promoCode,
                    orginalAmount: originalPrice,
                    discount: discountAmt,
                    transactionAmount: paymentDetail.price,
                    transactionId: transactionId,
                    paymentType: paymentType,
                    description: type == 'date' ? 'Payment Received for date' : 'Payment received for subscription',
                    transactionForm: 'debit',
                    transactionType: type,
                    createdAt: new Date()
                  }
                }
                const wh = {
                  userId: userDetail._id,
                  planId: paymentDetail._id,
                  bankTransactionId: stripeChargeId,
                  status: 'pending'
                }

                await model.Transaction.updateOne(wh, obj, { upsert: true })

                if (type == 'date') {
                  successMessage.message = 'Payment completed successfully'
                } else {
                  successMessage.message = 'Subscription activated successfully'
                }
                res.send(successMessage)
              } else {
                failedMessage.message = 'Something went wrong'
                res.send(failedMessage)
              }
            } else if (paymentType == 'netBank') {
              const price = paymentDetail.price
              const bankAccountToken = await plaidHelper.exchangePublicToken(plaidPublicToken, accountId)
              const chargeObj = await stripeHelper.createCharge(paymentDetail.price, 'usd', bankAccountToken, true)
              if (chargeObj && chargeObj.status == 'success' && chargeObj.data.status == 'succeeded') {
                setSubscription(userId, paymentId, type, false)
                const chargeId = chargeObj.id
                const transactionId = helper.generateTransactionId(15) // helper.randomNumber(6)+moment().format('hmmss');
                const obj = {
                  userId: userDetail._id,
                  planId: paymentDetail._id,
                  stripeChargeId: chargeId,
                  planName: paymentDetail.planName,
                  promoCode: promoCode,
                  orginalAmount: originalPrice,
                  discount: discountAmt,
                  transactionAmount: price,
                  transactionId: transactionId,
                  coinAddress: coinAddress,
                  paymentType: paymentType,
                  description: type == 'date' ? 'Payment received for date' : 'Payment received for subscription',
                  transactionForm: 'debit',
                  transactionType: type,
                  status: 'completed',
                  created_at: new Date()
                }
                model.Transaction.create(obj)

                if (type == 'date') {
                  successMessage.message = 'Payment completed successfully'
                } else {
                  successMessage.message = 'Subscription activated successfully'
                }
                res.send(successMessage)
              } else {
                console.log('activateSubscription------------->>chargeObj: ', chargeObj)
                failedMessage.message = 'Something went wrong'
                return res.send(failedMessage)
              }
            } else if (paymentType == 'btc' || paymentType == 'bch' || paymentType == 'ltc' || paymentType == 'eth') {
              let price = paymentDetail.price

              switch (paymentType) {
                case 'btc': price = (config.btcChange > 0) ? price / config.btcChange : 1; break
                case 'ltc': price = (config.ltcChange > 0) ? price / config.ltcChange : 1; break
                case 'eth': price = (config.ethChange > 0) ? price / config.ethChange : 1; break
                case 'bch': price = (config.bchChange > 0) ? price / config.bchChange : 1; break
              }
              console.log('activateSubscription-------->>>price: ', price.toFixed(5))
              coinPayment.createTransaction({ currency1: paymentType, currency2: paymentType, amount: parseFloat(price).toFixed(5), buyer_email: userDetail.email, ipn_url: config.baseUrl + 'api/payment/coinResponse' }, function (err, result) {
                if (!err) {
                  const transactionId = result.txn_id
                  const coinAddress = result.address
                  const obj = {
                    userId: userDetail._id,
                    planId: paymentDetail._id,
                    planName: paymentDetail.planName,
                    promoCode: promoCode,
                    orginalAmount: originalPrice,
                    discount: discountAmt,
                    transactionAmount: price,
                    transactionId: transactionId,
                    coinAddress: coinAddress,
                    paymentType: paymentType,
                    description: type == 'date' ? 'Payment received for date' : 'Payment received for subscription',
                    transactionForm: 'debit',
                    transactionType: type,
                    status: 'pending',
                    created_at: new Date()
                  }

                  model.Transaction.create(obj)
                  successMessage.message = 'Please scan the QR code'
                  successMessage.data = result
                  res.send(successMessage)
                } else {
                  console.log('activateSubscription::::::::::::::>>>>err: ', err)
                  failedMessage.message = 'Something went wrong! please try again later'
                  res.send(failedMessage)
                }
              })
            } else {
              failedMessage.message = 'Invalid payment type'
              res.send(failedMessage)
            }
          }
        } else {
          failedMessage.message = 'Plan detail not found'
          res.send(failedMessage)
        }
      } else {
        console.log('activateSubscription--------->>>>"user not found"')
        failedMessage.message = 'Something went wrong! Please try again later'
        res.send(failedMessage)
      }
    } catch (e) {
      console.log('activateSubscription:::::::::::>>>>e: ', e)
      failedMessage.message = 'Something went wrong'
      res.send(failedMessage)
    }
  }

  module.coinResponse = async (req, res) => {
    try {
      var status = parseInt(req.body.status)
      var txnId = req.body.txn_id
      // console.log('coinResponse--------->>>>status: '+status+' txnId: '+txnId);
      var transDetail = await model.Transaction.findOne({ transactionId: txnId, status: 'pending' })
      if (transDetail) {
        const userId = transDetail.userId
        const planId = transDetail.planId
        if (status < 0) { // fail
          await model.Transaction.updateOne({ _id: transDetail._id }, { status: 'fail' })
        } else if (status >= 0 && status < 100) { // pending

        } else if (status >= 100) { // completed
          setSubscription(userId, planId, transDetail.transactionType, true)
          await model.Transaction.updateOne({ _id: transDetail._id }, { status: 'completed' })
          res.send('success')
        } else {
          res.send('fail')
        }
      } else {
        res.send('fail')
      }
    } catch (e) {
      console.log('coinResponse:::::::::::::::>>>e: ', e)
      res.send('fail')
    }
  }

  module.getPaymentDetails = async (req, res) => {
    var successMessage = { status: 'success', message: '', data: {} }
    var failedMessage = { status: 'fail', message: '', data: {} }
    try {
      var paymentId = req.body.paymentId
      var type = (req.body.type) ? req.body.type : 'plan'
      var userId = req.body.userId
      var promoCode = req.body.promoCode ? req.body.promoCode : ''
      console.log('getPaymentDetails-------->>>userId: ', userId, ' paymentId: ', paymentId, ' promoCode: ', promoCode)

      if (userId && paymentId) {
        var userDetails = await model.User.findOne({ _id: userId, isDeleted: false, role: 'user' })
        var paymentDetails = null
        if (type == 'date') {
          paymentDetails = await model.Dates.findOne({ _id: paymentId, $or: [{ initUserId: userId }, { initOppId: userId }], status: 'pending', paymentStatus: { $ne: 'completed' }, isApproved: true }).lean()
          if (paymentDetails && paymentDetails.initUserId.toString() == userId.toString() && paymentDetails.userPaymentStatus == 'completed') {
            paymentDetails = null
            failedMessage.message = 'Payment Already done for this date'
            res.send(failedMessage)
          } else if (paymentDetails && paymentDetails.initOppId.toString() == userId.toString() && paymentDetails.oppPaymentStatus == 'completed') {
            paymentDetails = null
            failedMessage.message = 'Payment Already done for this date'
            res.send(failedMessage)
          }
        } else {
          paymentDetails = await model.Subscription.findOne({ _id: paymentId, isDeleted: false, status: true }).lean()
        }
        if (userDetails && paymentDetails) {
          console.log('getPaymentDetails---------->>>>>userDetails and paymentDetails found')
          if (!userDetails.isActive) {
            failedMessage.message = 'You have been blocked by admin'
            res.send(failedMessage)
          }

          // conditions for promocode
          let discount = 0
          if (promoCode) {
            const promoQuery = {
              $and: [
                {
                  promoCode: promoCode
                }, {
                  isDeleted: false,
                  status : true
                }, {
                  perUser: { $gt: 0 }
                }, {
                  $or:
									[
									  {
									    offerType: 'unlimited'
									  }, {
									    offerType: 'limited',
									    startDate: { $lt: new Date() },
									    endDate: { $gt: new Date() }
									  }
									]
                }
              ]
            }
            const promoCodeDetails = await model.Offer.findOne(promoQuery)
            if (promoCodeDetails) {
              discount = promoCodeDetails.discount
            } else {
              failedMessage.message = 'Promocode is invalid'
              return res.send(failedMessage)
            }
          }
          console.log('getPaymentDetails----------->>>>discount: ' + discount)

          let userSubData = null
          if (type == 'plan') {
            userSubData = await model.UserSubscription.countDocuments({ userId: userDetails._id, planType: paymentDetails.planType, expireAt: { $gte: new Date() }, isDeleted: false })
          }
          console.log('getPaymentDetails----------->>>>userSubData: ', userSubData)
          if (userSubData) {
            failedMessage.message = 'Subscription plan with same type is already activated'
            res.send(failedMessage)
          } else {
            console.log('getPaymentDetails----------->>>"payment details found"')
            const durationType = paymentDetails.durationType
            const duration = (paymentDetails.duration > 0) ? paymentDetails.duration : 1
            let price = 0
            if (type == 'date') {
              price = paymentDetails.totalPrice / 2
              paymentDetails.price = price
            } else {
              price = paymentDetails.price
            }

            if (discount) {
              const discountAmt = price * discount * 0.01
              price -= discountAmt
            }
            price = price || 0

            paymentDetails.price = price
            paymentDetails.discount = discount
            paymentDetails.pricePerUnit = (price / duration).toFixed(2)
            paymentDetails.singleDuration = durationType == 'monthly' ? 'Month' : 'Year'
            paymentDetails.finalDuration = duration == 1 ? paymentDetails.singleDuration : paymentDetails.singleDuration + 's'
            const btcChange = config.btcChange ? config.btcChange : 1
            const bchChange = config.bchChange ? config.bchChange : 1
            const ltcChange = config.ltcChange ? config.ltcChange : 1
            const ethChange = config.ethChange ? config.ethChange : 1

            paymentDetails.btcPrice = (price / btcChange).toFixed(5)
            paymentDetails.bchPrice = (price / bchChange).toFixed(5)
            paymentDetails.ltcPrice = (price / ltcChange).toFixed(5)
            paymentDetails.ethPrice = (price / ethChange).toFixed(5)

            const paymentIntent = await stripeHelper.createIntent(price, 'usd', { integration_check: 'accept_a_payment' })

            if (paymentIntent) {
              console.log('getPaymentDetails--------->>>"intent created"')
              const obj = {
                userData: userDetails,
                type: type,
                paymentData: paymentDetails,
                clientSecret: paymentIntent.client_secret,
                stripePublishKey: config.stripePublishKey,
                promoCode: promoCode
              }

              successMessage.message = 'Details loaded successfully'
              successMessage.data = obj
              res.send(successMessage)
            } else {
              console.log('getPaymentDetails------------->>>"payment intent not created"')
              failedMessage.message = 'Something went wrong. Please try again'
              res.send(failedMessage)
            }
          }
        } else {
          console.log('getPaymentDetails------------->>>"userData or payment data not found"')
          failedMessage.message = 'Something went wrong. Please try again'
          res.send(failedMessage)
        }
      } else {
        console.log('getPaymentDetails-------->>>"userID or paymentId is invalid"')
        failedMessage.message = 'Something went wrong. Please try again'
        res.send(failedMessage)
      }
    } catch (e) {
      console.log('getPaymentDetails::::::::::::>>>e: ', e)
      failedMessage.message = 'Something went wrong'
      res.send(failedMessage)
    }
  }

  module.getUserSubscription = async (req, res) => {
    var successMessage = { status: 'success', message: '', data: {} }
    var failedMessage = { status: 'fail', message: '', data: {} }
    try {
      let userId = req.body.userId;
      let token = req.headers.token;
      if (userId) {
        let userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role: 'user'});
        if (userDetails) {
          if (!userDetails.isActive) {
            failedMessage.message = 'You have been blocked by admin'
            res.send(failedMessage)
          }

          let userSubscriptionData = await model.UserSubscription.find({userId: userDetails._id, isDeleted: false, isExpired: false, expireAt: {$gt: new Date()}},{planId:1,planType:1,price:1,benefits:1}).lean();
          if (userSubscriptionData && userSubscriptionData.length) {
            for (let i = 0; i < userSubscriptionData.length; i++) {
              let type = userSubscriptionData[i].planType;
              if (type == 'premium') {
                userSubscriptionData[i].text = "Premium Subscription";
              } else if (type == 'getlist') {
                userSubscriptionData[i].text = "Get A List";
              } else if (type == 'getboost'){
                userSubscriptionData[i].text = "Get Boost";
              } else {
                userSubscriptionData[i].text = "Subscription pack"; //anonymous
              }
            }
          } 
          successMessage.message = "User subscriptions loaded successfully";
          successMessage.data = {list: userSubscriptionData};
          res.send(successMessage);
        } else {
          console.log('getUserSubscription--------->>>"user not found"');
          failedMessage.message = "Something went wrong";
          res.send(failedMessage);
        }
      } else {
        console.log('getUserSubscription--------->>>>"user id is invalid"');
        failedMessage.message = "User id is invalid";
        res.send(failedMessage);
      }
    } catch(e) {
      console.log('getUserSubscription:::::::::::>>>e: ',e);
      failedMessage.message = "Someting went wrong";
      res.send(failedMessage);
    }
  }

  module.cancelSubscription = async (req, res) => {
    var successMessage = { status: 'success', message: '', data: {} }
    var failedMessage = { status: 'fail', message: '', data: {} }
    try {
      let userId = req.body.userId;
      let token = req.headers.token;
      let subscriptionId = req.body.subscriptionId;
      if (userId) {
        let userDetails = await model.User.findOne({_id: userId, loginToken: token, isDeleted: false, role: 'user'});
        if (userDetails) {
          if (!userDetails.isActive) {
            failedMessage.message = 'You have been blocked by admin'
            res.send(failedMessage)
          }

          let userSubscriptionData = await model.UserSubscription.findOne({_id: subscriptionId,userId: userDetails._id ,isDeleted: false, isExpired: false, expireAt: {$gt: new Date()}});
          if (userSubscriptionData) {
            let check = await model.UserSubscription.updateOne({_id: userSubscriptionData._id},{$set:{isDeleted: true}});
            if (check && check.nModified) {

              let tmp = [];  
              let benefits = {};            
              let activeSubscription = await model.UserSubscription.find({userId: userDetails._id, isDeleted: false, isExpired: false, expireAt: {$gt: new Date()}});
              if (activeSubscription && activeSubscription.length) {
                for (let i = 0; i < activeSubscription.length; i++) {
                  tmp = tmp.concat(activeSubscription[i].benefits);
                }
                tmp = _.unique(tmp);
                for (let j = 0; j < tmp.length; j++) {
                  if (!benefits[tmp[j]]) {
                    benefits[tmp[j]] = true;
                  }
                }
              }

              await model.User.updateOne({_id: userId}, {benefits: benefits});
              successMessage.message = "Subscription successfully cancelled";
              res.send(successMessage);
            } else {
              console.log('cancelSubscription--------->>>"subscription not cancelled"');
              failedMessage.message = "Something went wrong";
              res.send(failedMessage);
            }
          } else {
            failedMessage.message = "Subscription not exists or alrady expired";
            res.send(failedMessage);
          }
        } else {
          console.log('cancelSubscription--------->>>"user data not found"');
          failedMessage.message = "Something went wrong";
          res.send(failedMessage);
        }
      } else {
        console.log('cancelSubscription--------->>>"user id is invalid"');
        failedMessage.message = "User id is invalid";
        res.send(failedMessage);
      }
    } catch (e) {
      console.log('cancelSubscription--------->>>e: ',e);
      failedMessage.message = "Something went wrong";
      res.send(failedMessage);
    }
  }
  return module
}
