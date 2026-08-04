const { getPlaidClient } = require('./_plaid-client');
const { getSupabaseClient, verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { public_token, institution_name } = JSON.parse(event.body);
    const client = getPlaidClient();
    const supabase = getSupabaseClient();

    const exchange = await client.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchange.data;

    const { error } = await supabase.from('plaid_items').insert({
      item_id,
      access_token, // stored server-side only, RLS should restrict this table from any public API access
      institution_name: institution_name || 'Unknown institution',
    });

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true, item_id }) };
  } catch (err) {
    console.error('exchange token error', err.response?.data || err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to link account' }) };
  }
};
