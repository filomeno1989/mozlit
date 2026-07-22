// =====================================================================
// CONFIGURAÇÃO DO SUPABASE
// Este é o ÚNICO arquivo onde você precisa colar as suas chaves.
//
// Onde encontrar:
//   Painel do Supabase → Project Settings (ícone de engrenagem) → API
//   - "Project URL"      → cole em SUPABASE_URL
//   - "anon public" key  → cole em SUPABASE_ANON_KEY
// =====================================================================

const SUPABASE_URL = 'https://jeyjzfpnersgfbavamsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleWp6ZnBuZXJzZ2ZiYXZhbXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDExNjQsImV4cCI6MjA5OTYxNzE2NH0.xwgPL_tKl2gR3LsdIHrTfpx2E4go6yxb_mJLDkuyvY4';

// Cria o cliente Supabase usado por todo o site (não mexer abaixo desta linha)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
