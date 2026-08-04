const { getPlaidClient } = require('./_plaid-client');
const { verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: 'frank' },
      client_name: 'Personal Finance Dashboard',
      products: ['transactions', 'investments'],
      country_codes: ['US'],
      language: 'en',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ link_token: response.data.link_token }),
    };
  } catch (err) {
    console.error('link token error', err.response?.data || err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create link token' }) };
  }
};
