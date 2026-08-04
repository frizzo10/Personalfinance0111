const { getPlaidClient } = require('./_plaid-client');
const { verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: {
        client_user_id: 'frank',
        // Marking the phone as already verified skips Plaid Link's SMS
        // verification screen, which was blocking sandbox testing.
        phone_number: process.env.OWNER_PHONE_NUMBER || undefined,
        phone_number_verified_time: process.env.OWNER_PHONE_NUMBER ? new Date().toISOString() : undefined,
      },
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
