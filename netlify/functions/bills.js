const { getSupabaseClient, verifyAccess } = require('./_supabase-client');

exports.handler = async (event) => {
  if (!verifyAccess(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const supabase = getSupabaseClient();

  try {
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { error } = await supabase.from('bills').insert({
        payee: body.payee,
        amount: body.amount,
        due_day: body.due_day,
        next_due_date: body.next_due_date,
        pay_url: body.pay_url,
        notes: body.notes,
        source: 'manual',
      });
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const { id, ...updates } = body;
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase.from('bills').update(updates).eq('id', id);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('bills error', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Bill operation failed' }) };
  }
};
