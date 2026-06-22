import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jordlfuxxfhuicbmnnlf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmRsZnV4eGZodWljYm1ubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjYwMDYsImV4cCI6MjA5NzQ0MjAwNn0.m0M4mmXpeQKL6gVpoBaFqgfgBpwCYa0Cg0sK8kt4Mfw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const BUK_CONFIG = {
  baseUrl: 'https://ferco-medical.buk.pe/api/v1/peru',
  authToken: 'rw8epoUvKck3NZZSp83fFGkR',
};

export const ADMIN_EMAILS = [
  'drosado@ferco-medical.com',
  'ahuamani@ferco-medical.com',
];