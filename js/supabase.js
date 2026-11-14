// ===== CONNECTION TO SUPABASE =====
// Only the PUBLISHABLE key goes here. Never paste the secret key.

const SUPABASE_URL = "https://qtvthaaqextxqvfdjhgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_HAhCNp2_A8aB8inG93YNcw_Jzy1N61t";

// "db" is our connection. Other files use it to read and save data.
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);