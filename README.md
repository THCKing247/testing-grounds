# github.io
Official website for Apex Technical Solutions Group LLC. Built using GitHub Pages to showcase services, projects, and future SaaS offerings.

## AI Chatbot Setup (Ollama)

The website includes an AI-powered chatbot that uses Ollama (local AI models). To enable AI responses:

### Prerequisites
1. **Install Ollama**: Download from https://ollama.ai
2. **Start Ollama**: Run `ollama serve` in your terminal (usually runs on `http://localhost:11434`)
3. **Pull a model**: Run `ollama pull llama2` (or `mistral`, `codellama`, `phi`, `gemma`, etc.)

### Configuration

#### Option 1: Browser Console (Quick Setup)
1. Open your browser's developer console (F12)
2. Set custom Ollama URL (if different from default):
   ```javascript
   setChatbotOllamaUrl('http://localhost:11434')
   ```
3. Set model name:
   ```javascript
   setChatbotModel('llama2') // or 'mistral', 'codellama', etc.
   ```

#### Option 2: Direct Configuration
Edit `assets/site.js` and configure the `AI_CONFIG` object:
```javascript
const AI_CONFIG = {
  enabled: true,
  baseUrl: "http://localhost:11434", // Your Ollama server URL
  model: "llama2", // Model name (llama2, mistral, codellama, phi, gemma)
  temperature: 0.7,
  stream: false
};
```

### Check Status
Run `checkChatbotAI()` in the browser console to verify the AI is configured.

### Popular Ollama Models
- `llama2` - General purpose, good balance
- `mistral` - Fast and efficient
- `codellama` - Great for technical questions
- `phi` - Small and fast
- `gemma` - Google's open model

### Important Notes
- **Local Only**: Ollama runs locally on your machine - no API keys or internet required
- **Performance**: Response time depends on your hardware and model size
- **Fallback**: If Ollama is not running or fails, the chatbot automatically falls back to keyword-based responses
- **CORS**: If hosting on a different domain, you need to configure CORS in Ollama (see below)

### CORS & Mixed Content Configuration (Required for Production)

**The Issue**: When your website is hosted on HTTPS (like `https://apextsgroup.com`), browsers block HTTP requests to `localhost:11434` due to:
1. **Mixed Content Policy**: HTTPS pages cannot access HTTP resources
2. **CORS Policy**: Cross-origin requests need proper headers

**⚠️ Important**: Direct connection from HTTPS website to HTTP localhost is **not possible** due to browser security.

**Solution 1: Backend Proxy (Recommended for Production)**

A ready-to-use proxy server is included in this repository! See `PROXY_SETUP.md` for full instructions.

Quick start:
1. Install dependencies: `npm install`
2. Start proxy: `node ollama-proxy.js`
3. Expose over HTTPS using ngrok or Cloudflare Tunnel (see `PROXY_SETUP.md`)
4. Update `AI_CONFIG.baseUrl` to your HTTPS proxy URL

The proxy handles CORS and allows your HTTPS website to connect to Ollama.

**Solution 2: Configure Ollama CORS (For HTTP sites or local testing)**

Set the `OLLAMA_ORIGINS` environment variable before starting Ollama:

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="https://apextsgroup.com,https://www.apextsgroup.com"
ollama serve
```

**Windows (Command Prompt):**
```cmd
set OLLAMA_ORIGINS=https://apextsgroup.com,https://www.apextsgroup.com
ollama serve
```

**Linux/Mac:**
```bash
export OLLAMA_ORIGINS="https://apextsgroup.com,https://www.apextsgroup.com"
ollama serve
```

**To make it permanent on Windows**, create a batch file or set it in System Environment Variables.

**Solution 2: Use a Backend Proxy**

For production, set up a backend proxy that:
1. Runs on your server
2. Connects to Ollama
3. Adds proper CORS headers
4. Your website calls the proxy instead of Ollama directly

**Solution 3: Local Development (For Testing Only)**

For local testing where both site and Ollama are on localhost:
- Access your site via `http://localhost` (not HTTPS)
- Or use a local development server on HTTP
- This only works when both are on the same origin (localhost)

**Solution 4: HTTPS Reverse Proxy**

Set up a reverse proxy (nginx, Caddy, etc.) to expose Ollama over HTTPS:
- Configure SSL certificate
- Proxy requests from `https://your-domain.com/ollama` to `http://localhost:11434`
- Update `AI_CONFIG.baseUrl` to your HTTPS endpoint

### Troubleshooting
- **CORS Error**: Configure `OLLAMA_ORIGINS` environment variable (see above)
- **Connection Error**: Make sure Ollama is running (`ollama serve`)
- **Model Not Found**: Pull the model first (`ollama pull model-name`)
- **Slow Responses**: Try a smaller model like `phi` or `gemma:2b`
- **403 Forbidden**: Usually means CORS is not configured - set `OLLAMA_ORIGINS`

### Disable AI
Set `AI_CONFIG.enabled = false` to use keyword matching only.
