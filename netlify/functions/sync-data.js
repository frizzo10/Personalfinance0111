const { getPlaidClient } = require('./_plaid-client');
const { getSupabaseClient, verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const client = getPlaidClient();
  const supabase = getSupabaseClient();

  try {
    const { data: items, error: itemsErr } = await supabase.from('plaid_items').select('*');
    if (itemsErr) throw itemsErr;
    if (!items || items.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No linked accounts yet' }) };
    }

    let accountsSynced = 0;
    let transactionsSynced = 0;
    let holdingsSynced = 0;

    for (const item of items) {
      const access_token = item.access_token;

      // --- Accounts + balances ---
      const accountsResp = await client.accountsGet({ access_token });
      for (const acct of accountsResp.data.accounts) {
        await supabase.from('accounts').upsert({
          item_id: item.item_id,
          account_id: acct.account_id,
          name: acct.name,
          official_name: acct.official_name,
          type: acct.type,
          subtype: acct.subtype,
          mask: acct.mask,
          current_balance: acct.balances.current,
          available_balance: acct.balances.available,
          iso_currency_code: acct.balances.iso_currency_code || 'USD',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'account_id' });
        accountsSynced++;
      }

      // --- Transactions (last 30 days) ---
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      try {
        const txResp = await client.transactionsGet({
          access_token,
          start_date: start,
          end_date: end,
          options: { count: 250 },
        });
        for (const tx of txResp.data.transactions) {
          await supabase.from('transactions').upsert({
            account_id: tx.account_id,
            transaction_id: tx.transaction_id,
            name: tx.name,
            merchant_name: tx.merchant_name,
            amount: tx.amount,
            category: tx.personal_finance_category?.primary || (tx.category ? tx.category[0] : null),
            pending: tx.pending,
            date: tx.date,
          }, { onConflict: 'transaction_id' });
          transactionsSynced++;
        }
      } catch (txErr) {
        console.error('transactions sync skipped for item', item.item_id, txErr.response?.data || txErr.message);
      }

      // --- Investment holdings ---
      try {
        const holdingsResp = await client.investmentsHoldingsGet({ access_token });
        for (const h of holdingsResp.data.holdings) {
          const security = holdingsResp.data.securities.find(s => s.security_id === h.security_id);
          await supabase.from('investment_holdings').upsert({
            account_id: h.account_id,
            security_id: h.security_id,
            ticker: security?.ticker_symbol || null,
            name: security?.name || 'Unknown security',
            quantity: h.quantity,
            institution_value: h.institution_value,
            cost_basis: h.cost_basis,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'security_id,account_id' });
          holdingsSynced++;
        }
      } catch (invErr) {
        // Not every account supports investments - fine to skip
        console.log('no investment data for item', item.item_id);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ accountsSynced, transactionsSynced, holdingsSynced }),
    };
  } catch (err) {
    console.error('sync error', err.response?.data || err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Sync failed' }) };
  }
};
