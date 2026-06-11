const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── AI proxy → Groq ──────────────────────────
app.post('/api/ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'No response.';
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Supabase: save profile ────────────────────
app.post('/api/profile', async (req, res) => {
  const { user_id, profile } = req.body;
  if (!user_id) return res.status(400).json({ error: 'No user_id' });

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id, profile, updated_at: new Date().toISOString() });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Supabase: load profile ────────────────────
app.get('/api/profile/:user_id', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', req.params.user_id)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json({ data: data || null });
});

// ── Supabase: save state ──────────────────────
app.post('/api/state', async (req, res) => {
  const { user_id, state } = req.body;
  if (!user_id) return res.status(400).json({ error: 'No user_id' });

  const { error } = await supabase
    .from('states')
    .upsert({ user_id, state, updated_at: new Date().toISOString() });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Supabase: load state ──────────────────────
app.get('/api/state/:user_id', async (req, res) => {
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('user_id', req.params.user_id)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json({ data: data || null });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`ScholarMatch running on :${PORT}`));
