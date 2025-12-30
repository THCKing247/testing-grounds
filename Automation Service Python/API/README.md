# Apex Automation Services API

This Flask API exposes all Apex Automation Python services as REST endpoints for use in the client portal dashboard.

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the API Server**
   ```bash
   python api.py
   ```
   
   The API will run on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Services
- `GET /api/services` - List all available automation services

### Individual Service Endpoints

#### Data Clean Engine
- `POST /api/services/data-clean`
  ```json
  {
    "csv_text": "your,csv,content",
    "delimiter": ",",
    "normalize_headers": true,
    "drop_empty_rows": true
  }
  ```

#### Voice of Customer
- `POST /api/services/voice-of-customer`
  ```json
  {
    "transcript_text": "customer call transcript...",
    "max_summary_sentences": 6
  }
  ```

#### Content Operations
- `POST /api/services/content-ops`
  ```json
  {
    "content_type": "email",
    "notes": "content notes...",
    "audience": "customer",
    "tone": "professional",
    "subject": "Optional subject",
    "call_to_action": "Optional CTA"
  }
  ```

#### Help Desk
- `POST /api/services/help-desk`
  ```json
  {
    "action": "load_kb" | "answer",
    "json_text": "[...]",  // for load_kb
    "question": "...",     // for answer
    "max_articles": 3
  }
  ```

#### Reputation Review
- `POST /api/services/reputation-review`
  ```json
  {
    "action": "build_request" | "summarize",
    "customer_name": "...",
    "business_name": "...",
    "review_link": "...",
    "channel": "sms" | "email",
    "reviews": [...]  // for summarize
  }
  ```

#### Missed Call
- `POST /api/services/missed-call`
  ```json
  {
    "caller_name": "...",
    "phone": "...",
    "reason": "...",
    "business_name": "Apex",
    "channel": "sms" | "email"
  }
  ```

#### Speed to Lead
- `POST /api/services/speed-to-lead`
  ```json
  {
    "name": "...",
    "email": "...",
    "phone": "...",
    "source": "...",
    "message": "..."
  }
  ```

#### Agency Toolkit
- `POST /api/services/agency-toolkit`
  ```json
  {
    "action": "validate" | "plan" | "execute",
    "workflow": {...},
    "payload": {...}  // for execute
  }
  ```

#### Custom GPTs
- `POST /api/services/custom-gpts`
  ```json
  {
    "role": "...",
    "team": "...",
    "capabilities": [...],
    "boundaries": [...],
    "knowledge_sources": [...]
  }
  ```

#### Compliance Policy
- `POST /api/services/compliance-policy`
  ```json
  {
    "company": "...",
    "policy_type": "gdpr" | "soc2" | "hipaa"
  }
  ```

#### Vertical Lead Generation
- `POST /api/services/vertical-lead-gen`
  ```json
  {
    "vertical": "...",
    "leads": [...],
    "keywords": [...],
    "min_score": 0.1,
    "limit": 50
  }
  ```

#### Lead Follow-up
- `POST /api/services/lead-followup`
  ```json
  {
    "action": "start_sequence" | "next_message",
    "lead_id": "...",
    "channel": "sms" | "email",
    "steps": 3,
    "first_delay_minutes": 5,
    "cadence_minutes": 1440,
    "sequence_id": "..."  // for next_message
  }
  ```

## Frontend Integration

The dashboard JavaScript (`assets/site.js`) is configured to connect to the API at `http://localhost:5000/api`. 

To change the API URL, update the `API_BASE_URL` constant in `assets/site.js`:

```javascript
const API_BASE_URL = 'http://your-api-url:5000/api';
```

## CORS

CORS is enabled for all origins. In production, you may want to restrict this to your domain only.

## Error Handling

All endpoints return JSON responses with a `success` field:
- `{"success": true, "result": {...}}` - Success
- `{"success": false, "error": "error message"}` - Error

## Notes

- The API loads services dynamically from the parent directory
- Services use the `shared_utils.py` module for common utilities
- Some services require optional dependencies (e.g., `openpyxl` for Excel support)
- Database services (Speed to Lead, Lead Follow-up) use SQLite files in the current directory

