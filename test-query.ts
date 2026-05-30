import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);

async function run() {
  const { data, error } = await supabase.from('tenants').select('id, name, slug').ilike('name', '%nabrasa%');
  console.log(JSON.stringify(data, null, 2), error);
}
run();
