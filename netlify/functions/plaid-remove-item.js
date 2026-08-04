const { getSupabaseClient, verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { item_id } = JSON.parse(event.body);
    const supabase = getSupabaseClient();

    // accounts/transactions/investment_holdings all reference plaid_items
    // via ON DELETE CASCADE in the schema, so removing the item cleans up everything.
    const { error } = await supabase.from('plaid_items').delete().eq('item_id', item_id);
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('remove item error', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to disconnect account' }) };
  }
};
