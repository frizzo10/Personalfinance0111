const { getSupabaseClient, verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const supabase = getSupabaseClient();

  try {
    const [accounts, transactions, holdings, bills, items] = await Promise.all([
      supabase.from('accounts').select('*').order('type'),
      supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('investment_holdings').select('*'),
      supabase.from('bills').select('*').order('next_due_date', { ascending: true }),
      supabase.from('plaid_items').select('item_id, institution_name, created_at'),
    ]);

    // Attach institution name to each account so duplicate sandbox test
    // accounts (same fake names across different connected "banks") are
    // still distinguishable in the UI.
    const itemMap = {};
    (items.data || []).forEach(i => { itemMap[i.item_id] = i.institution_name; });
    const accountsWithInstitution = (accounts.data || []).map(a => ({
      ...a,
      institution_name: itemMap[a.item_id] || 'Unknown institution',
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        accounts: accountsWithInstitution,
        transactions: transactions.data || [],
        holdings: holdings.data || [],
        bills: bills.data || [],
        items: items.data || [],
      }),
    };
  } catch (err) {
    console.error('dashboard fetch error', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load dashboard' }) };
  }
};
