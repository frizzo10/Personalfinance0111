const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // service key - server-side only, never exposed to frontend
  );
}

// Simple shared-secret gate since this is single-user.
// Frontend sends this header on every call; set APP_ACCESS_KEY in Netlify env.
function verifyAccess(event) {
  const key = event.headers['x-app-key'];
  return key && key === process.env.APP_ACCESS_KEY;
}

module.exports = { getSupabaseClient, verifyAccess };
