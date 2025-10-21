require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eyitdims',
  waitForConnections: true,
  connectionLimit: process.env.DB_CONN_LIMIT ? Number(process.env.DB_CONN_LIMIT) : 10,
  queueLimit: 0
});

app.use(express.static(path.join(__dirname)));

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (!fullname || !username || !email || !password) return res.status(400).json({ ok: false, error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (fullname, username, email, password_hash) VALUES (?, ?, ?, ?)', [fullname, username, email, hash]);
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Register error', err.message || err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// Login endpoint (simple email/username + password)
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier = email or username
  if (!identifier || !password) return res.status(400).json({ ok: false, error: 'Missing fields' });
  try {
    const [rows] = await pool.query('SELECT id, fullname, username, email, password_hash FROM users WHERE email = ? OR username = ? LIMIT 1', [identifier, identifier]);
    const user = rows[0];
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    // Basic response (no session/token implemented here)
    res.json({ ok: true, user: { id: user.id, fullname: user.fullname, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error', err.message || err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// Forgot password (stores token in password_resets table)
app.post('/api/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: 'Missing email' });
  try {
    const token = Math.random().toString(36).slice(2, 18);
    await pool.query('INSERT INTO password_resets (email, token, created_at) VALUES (?, ?, NOW())', [email, token]);
    // In production send email with token. Here we return token for testing.
    res.json({ ok: true, token });
  } catch (err) {
    console.error('Forgot error', err.message || err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// Status and items endpoints
app.get('/api/status', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    res.json({ ok: true, db: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, description, created_at FROM items LIMIT 100');
    res.json({ ok: true, items: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
