var config = require('../../config/constants.js');
var plaid = require('plaid');

var plaidClient = new plaid.Client(
  config.plaidClientId,
  config.plaidSecret,
  config.plaidPublicKey,
  plaid.environments.sandbox
);

module.exports = {
	exchangePublicToken: async function(publicToken, accountId) {
		return new Promise((resolve) => {
			plaidClient.exchangePublicToken(publicToken, function(err, res) {
				var accessToken = res.access_token;
				// Generate a bank account token
				plaidClient.createStripeToken(accessToken, accountId, function(err, res) {
					console.log('exchangePublicToken-------->>>>err: ',err);
					console.log('exchangePublicToken-------->>>res: ',res);
					var bankAccountToken = res.stripe_bank_account_token;
					resolve(bankAccountToken);
				});
			});
		});
	}
}