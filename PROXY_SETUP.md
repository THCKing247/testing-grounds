# Ollama Proxy Setup Guide

Since your website is on HTTPS (`https://apextsgroup.com`) and Ollama runs on HTTP (`http://localhost:11434`), browsers block the connection due to mixed content policy. This proxy solves that problem.

## Quick Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start the Proxy

```bash
node ollama-proxy.js
```

The proxy will run on `http://localhost:3000`

### Step 3: Expose Over HTTPS

You have two options:

#### Option A: Use ngrok (Easiest)

1. Install ngrok: https://ngrok.com/download
2. In a new terminal, run:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update your website's `AI_CONFIG.baseUrl` to use this URL

#### Option B: Use Cloudflare Tunnel (Free, Permanent)

1. Install Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Run:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Copy the HTTPS URL provided
4. Update your website's `AI_CONFIG.baseUrl`

### Step 4: Update Website Configuration

In `assets/site.js`, update the `AI_CONFIG`:

```javascript
const AI_CONFIG = {
  enabled: true,
  baseUrl: "https://your-ngrok-url.ngrok.io", // or your Cloudflare Tunnel URL
  model: "llama3", // or your preferred model
  temperature: 0.7,
  stream: false
};
```

Or set it via browser console:
```javascript
setChatbotOllamaUrl('https://your-ngrok-url.ngrok.io')
```

## Environment Variables

You can customize the proxy:

```bash
# Change proxy port
PORT=8080 node ollama-proxy.js

# Change Ollama URL (if Ollama is on a different machine)
OLLAMA_URL=http://192.168.1.100:11434 node ollama-proxy.js
```

## Production Deployment

For production, deploy this proxy to:
- A VPS (DigitalOcean, Linode, etc.)
- A cloud service (Railway, Render, Fly.io)
- Your own server

Make sure to:
1. Set up HTTPS (SSL certificate)
2. Configure your domain to point to the proxy
3. Update `AI_CONFIG.baseUrl` to your production proxy URL

## Testing

1. Make sure Ollama is running: `ollama serve`
2. Start the proxy: `node ollama-proxy.js`
3. Test the proxy: `curl http://localhost:3000/health`
4. Test from your website using the browser console: `testChatbotAI()`

