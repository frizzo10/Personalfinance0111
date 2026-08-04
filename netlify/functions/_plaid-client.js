const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

function getPlaidClient() {
  const env = process.env.PLAID_ENV || 'sandbox'; // sandbox -> development -> production
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  return new PlaidApi(configuration);
}

module.exports = { getPlaidClient };
