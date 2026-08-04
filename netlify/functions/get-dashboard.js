const { getSupabaseClient, verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const supabase = getSupabaseClient();

  try {
    const [accounts, transactions, holdings, bills] = await Promise.all([
      supabase.from('accounts').select('*').order('type'),
      supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('investment_holdings').select('*'),
      supabase.from('bills').select('*').order('next_due_date', { ascending: true }),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        accounts: accounts.data || [],
        transactions: transactions.data || [],
        holdings: holdings.data || [],
        bills: bills.data || [],
      }),
    };
  } catch (err) {
    console.error('dashboard fetch error', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load dashboard' }) };
  }
};
