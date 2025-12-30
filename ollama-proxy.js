/**
 * Ollama Proxy Server
 * 
 * This proxy server allows your HTTPS website to connect to Ollama running locally.
 * 
 * Setup:
 * 1. Install Node.js if you haven't already
 * 2. Install dependencies: npm install express cors
 * 3. Run: node ollama-proxy.js
 * 4. Update your website's AI_CONFIG.baseUrl to point to this proxy
 * 
 * For production, deploy this to a server with HTTPS (or use a tunneling service)
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Enable CORS for your website
app.use(cors({
  origin: [
    'https://apextsgroup.com',
    'https://www.apextsgroup.com',
    'http://localhost:3000', // For local testing
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ollama: OLLAMA_URL });
});

// Proxy /api/tags endpoint
app.get('/api/tags', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying /api/tags:', error);
    res.status(500).json({ error: 'Failed to connect to Ollama' });
  }
});

// Proxy /api/chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying /api/chat:', error);
    res.status(500).json({ error: 'Failed to connect to Ollama', message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ollama Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxying to: ${OLLAMA_URL}`);
  console.log(`🌐 Accessible from: https://apextsgroup.com`);
  console.log(`\n💡 To expose over HTTPS, use a tunneling service like:`);
  console.log(`   - ngrok: ngrok http ${PORT}`);
  console.log(`   - Cloudflare Tunnel: cloudflared tunnel --url http://localhost:${PORT}`);
});

