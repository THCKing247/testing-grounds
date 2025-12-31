"""
Flask API for Apex Automation Services
Exposes all Python automation services as REST API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add parent directory to path to import services
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Import all services - using importlib to handle numeric prefixes
import importlib.util

def load_service(module_name, class_name):
    """Load a service class from a file with numeric prefix"""
    file_path = os.path.join(parent_dir, module_name)
    if not os.path.exists(file_path):
        raise ImportError(f"Service file not found: {file_path}")
    # Create a valid module name (Python modules can't start with numbers)
    valid_name = f"service_{module_name.replace('.py', '').replace('_', '')}"
    spec = importlib.util.spec_from_file_location(valid_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load spec for {module_name}")
    module = importlib.util.module_from_spec(spec)
    # Register the module in sys.modules so imports work correctly
    sys.modules[valid_name] = module
    spec.loader.exec_module(module)
    if not hasattr(module, class_name):
        raise ImportError(f"Class {class_name} not found in {module_name}")
    return getattr(module, class_name)

# Load all services
try:
    ApexDataCleanEngine = load_service('1_data_clean_engine.py', 'ApexDataCleanEngine')
    VoiceOfCustomerInsightsSystem = load_service('2_voice_of_customer.py', 'VoiceOfCustomerInsightsSystem')
    AIHelpDesk = load_service('4_ai_help_desk.py', 'AIHelpDesk')
    ReputationReviewAutomationEngine = load_service('5_reputation_review_automation.py', 'ReputationReviewAutomationEngine')
    MissedCallAutomation = load_service('6_missed_call_automation.py', 'MissedCallAutomation')
    SpeedToLeadAutomationSystem = load_service('7_speed_to_lead_automation.py', 'SpeedToLeadAutomationSystem')
    AILeadFollowUpNurtureSystem = load_service('12_ai_lead_followup_nurture.py', 'AILeadFollowUpNurtureSystem')
except Exception as e:
    print(f"Error loading services: {e}")
    raise

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Initialize service instances
data_clean_engine = ApexDataCleanEngine()
voc_system = VoiceOfCustomerInsightsSystem()
help_desk = AIHelpDesk()
reputation_engine = ReputationReviewAutomationEngine()
missed_call = MissedCallAutomation()
speed_to_lead = SpeedToLeadAutomationSystem()
lead_nurture = AILeadFollowUpNurtureSystem()


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'services': 'available'})


@app.route('/api/services', methods=['GET'])
def list_services():
    """List all available automation services"""
    services = [
        {
            'id': 'data-clean',
            'name': 'Data Clean Engine',
            'description': 'Cleans, standardizes, and fixes messy CSV/Excel files',
            'icon': '🧹',
            'category': 'data'
        },
        {
            'id': 'voice-of-customer',
            'name': 'Voice of Customer',
            'description': 'Analyzes customer call transcripts to extract insights, sentiment, and summaries',
            'icon': '🎤',
            'category': 'analytics'
        },
        {
            'id': 'help-desk',
            'name': 'AI Help Desk',
            'description': 'Knowledge base system that retrieves relevant articles and drafts responses',
            'icon': '🆘',
            'category': 'support'
        },
        {
            'id': 'reputation-review',
            'name': 'Reputation Review Automation',
            'description': 'Automates reputation management and review responses',
            'icon': '⭐',
            'category': 'reputation'
        },
        {
            'id': 'missed-call',
            'name': 'Missed Call Automation',
            'description': 'Automates follow-up for missed calls',
            'icon': '📞',
            'category': 'communication'
        },
        {
            'id': 'speed-to-lead',
            'name': 'Speed to Lead Automation',
            'description': 'Automates rapid response to new leads',
            'icon': '⚡',
            'category': 'sales'
        },
        {
            'id': 'lead-followup',
            'name': 'AI Lead Follow-up & Nurture',
            'description': 'Automates lead nurturing and follow-up sequences',
            'icon': '💬',
            'category': 'sales'
        }
    ]
    return jsonify({'services': services})


@app.route('/api/services/data-clean', methods=['POST'])
def data_clean():
    """Data Clean Engine service - supports batch file uploads, large files, and multiple formats"""
    try:
        # Check if files were uploaded (support multiple files)
        if 'files[]' in request.files or 'file' in request.files:
            # Handle batch uploads
            files = request.files.getlist('files[]') or [request.files.get('file')]
            files = [f for f in files if f and f.filename]
            
            if not files:
                return jsonify({'success': False, 'error': 'No files selected'}), 400
            
            # Get options from form data
            delimiter = request.form.get('delimiter', ',')
            normalize_headers = request.form.get('normalize_headers', 'true').lower() == 'true'
            drop_empty_rows = request.form.get('drop_empty_rows', 'true').lower() == 'true'
            apply_crm_mappings = request.form.get('apply_crm_mappings', 'true').lower() == 'true'
            file_type = request.form.get('file_type')
            sheet_name = request.form.get('sheet_name')
            
            # Get export format preferences
            export_formats_str = request.form.get('export_formats', 'csv,json,excel')
            export_formats = [f.strip() for f in export_formats_str.split(',')] if export_formats_str else ['csv']
            
            # Process all files
            results = []
            for file in files:
                if not file.filename:
                    continue
                
                filename = file.filename
                file_content = file.read()
                
                # Use streaming method for large files (handles 100k+ entries)
                try:
                    outputs, report = data_clean_engine.clean_file_streaming(
                        file_content,
                        filename,
                        file_type=file_type if file_type else None,
                        delimiter=delimiter,
                        normalize_headers=normalize_headers,
                        drop_empty_rows=drop_empty_rows,
                        apply_crm_mappings=apply_crm_mappings,
                        sheet_name=sheet_name if sheet_name else None,
                        chunk_size=10000,  # Process in 10k row chunks
                        export_formats=export_formats,  # Only generate requested formats
                    )
                    
                    # Filter outputs based on user's export format preferences
                    import base64
                    result_data = {
                        'filename': filename,
                        'success': True,
                        'outputs': {},
                        'column_files': {},
                        'report': {
                            'rows_in': report.rows_in,
                            'rows_out': report.rows_out,
                            'columns_in': report.columns_in,
                            'columns_out': report.columns_out,
                            'header_map': report.header_map,
                            'fixes': report.fixes,
                            'started_at': report.started_at,
                            'finished_at': report.finished_at,
                            'file_type': report.file_type,
                            'crm_detected': report.crm_detected,
                            'field_mappings': report.field_mappings,
                            'duplicates_removed': getattr(report, 'duplicates_removed', 0),
                            'irrelevant_rows_removed': getattr(report, 'irrelevant_rows_removed', 0),
                        }
                    }
                    
                    # Only include requested export formats
                    if 'csv' in export_formats and outputs.get('master_cleanse_csv'):
                        result_data['outputs']['master_cleanse_csv'] = outputs['master_cleanse_csv']
                    
                    if 'json' in export_formats and outputs.get('master_cleanse_json'):
                        result_data['outputs']['master_cleanse_json'] = outputs['master_cleanse_json']
                    
                    if 'excel' in export_formats and outputs.get('master_cleanse_excel'):
                        result_data['outputs']['master_cleanse_excel'] = base64.b64encode(
                            outputs['master_cleanse_excel']
                        ).decode('utf-8')
                    
                    # Column files (always included - core feature for data verification)
                    if outputs.get('column_files'):
                        for col_name, col_data in outputs['column_files'].items():
                            result_data['column_files'][col_name] = {}
                            if col_data.get('csv'):
                                result_data['column_files'][col_name]['csv'] = col_data['csv']
                            if col_data.get('json'):
                                result_data['column_files'][col_name]['json'] = col_data['json']
                            if col_data.get('excel'):
                                result_data['column_files'][col_name]['excel'] = base64.b64encode(
                                    col_data['excel']
                                ).decode('utf-8')
                    
                    results.append(result_data)
                    
                except Exception as e:
                    results.append({
                        'filename': filename,
                        'success': False,
                        'error': str(e)
                    })
            
            # Return batch results
            if len(results) == 1:
                # Single file - return directly
                return jsonify(results[0])
            else:
                # Multiple files - return array
                return jsonify({
                    'success': True,
                    'batch': True,
                    'files_processed': len(results),
                    'results': results
                })
        
        # Fallback to text-based input (for backward compatibility)
        if request.is_json:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            csv_text = data.get('csv_text', '')
            if not csv_text:
                return jsonify({'success': False, 'error': 'No CSV text provided'}), 400
            
            delimiter = data.get('delimiter', ',')
            normalize_headers = data.get('normalize_headers', True)
            drop_empty_rows = data.get('drop_empty_rows', True)
            
            cleaned_csv, report = data_clean_engine.clean_csv_text(
                csv_text,
                delimiter=delimiter,
                normalize_headers=normalize_headers,
                drop_empty_rows=drop_empty_rows
            )
            
            return jsonify({
                'success': True,
                'cleaned_csv': cleaned_csv,
                'report': {
                    'rows_in': report.rows_in,
                    'rows_out': report.rows_out,
                    'columns_in': report.columns_in,
                    'columns_out': report.columns_out,
                    'header_map': report.header_map,
                    'fixes': report.fixes,
                    'started_at': report.started_at,
                    'finished_at': report.finished_at,
                    'file_type': getattr(report, 'file_type', 'csv'),
                    'crm_detected': getattr(report, 'crm_detected', None),
                    'field_mappings': getattr(report, 'field_mappings', {}),
                    'duplicates_removed': getattr(report, 'duplicates_removed', 0),
                    'irrelevant_rows_removed': getattr(report, 'irrelevant_rows_removed', 0),
                }
            })
        else:
            return jsonify({'success': False, 'error': 'No file or data provided'}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/services/voice-of-customer', methods=['POST'])
def voice_of_customer():
    """Voice of Customer analysis service"""
    try:
        data = request.get_json()
        transcript_text = data.get('transcript_text', '')
        max_summary_sentences = data.get('max_summary_sentences', 6)
        
        result = voc_system.analyze_transcript(transcript_text, max_summary_sentences=max_summary_sentences)
        
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/services/help-desk', methods=['POST'])
def help_desk_endpoint():
    """AI Help Desk service"""
    try:
        data = request.get_json()
        action = data.get('action')
        
        if action == 'load_kb':
            json_text = data.get('json_text', '[]')
            help_desk.load_kb_from_json(json_text)
            return jsonify({'success': True, 'message': 'Knowledge base loaded'})
        
        elif action == 'answer':
            question = data.get('question', '')
            max_articles = data.get('max_articles', 3)
            result = help_desk.answer(question, max_articles=max_articles)
            return jsonify({'success': True, 'result': result})
        
        else:
            return jsonify({'success': False, 'error': 'Invalid action. Use "load_kb" or "answer"'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/services/reputation-review', methods=['POST'])
def reputation_review():
    """Reputation Review Automation service"""
    try:
        data = request.get_json()
        action = data.get('action')
        
        if action == 'build_request':
            customer_name = data.get('customer_name', '')
            business_name = data.get('business_name', '')
            review_link = data.get('review_link', '')
            channel = data.get('channel', 'sms')
            
            result = reputation_engine.build_review_request(
                customer_name=customer_name,
                business_name=business_name,
                review_link=review_link,
                channel=channel
            )
            return jsonify({'success': True, 'result': result})
        
        elif action == 'summarize':
            reviews = data.get('reviews', [])
            result = reputation_engine.summarize_reviews(reviews)
            return jsonify({'success': True, 'result': result})
        
        else:
            return jsonify({'success': False, 'error': 'Invalid action. Use "build_request" or "summarize"'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/services/missed-call', methods=['POST'])
def missed_call_endpoint():
    """Missed Call Automation service"""
    try:
        data = request.get_json()
        caller_name = data.get('caller_name')
        phone = data.get('phone', '')
        reason = data.get('reason')
        business_name = data.get('business_name', 'Apex')
        channel = data.get('channel', 'sms')
        
        result = missed_call.create_follow_up(
            caller_name=caller_name,
            phone=phone,
            reason=reason,
            business_name=business_name,
            channel=channel
        )
        
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/services/speed-to-lead', methods=['POST'])
def speed_to_lead_endpoint():
    """Speed to Lead Automation service"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        source = data.get('source')
        message = data.get('message')
        
        result = speed_to_lead.ingest_lead(
            name=name,
            email=email,
            phone=phone,
            source=source,
            message=message
        )
        
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/services/lead-followup', methods=['POST'])
def lead_followup():
    """AI Lead Follow-up & Nurture service"""
    try:
        data = request.get_json()
        action = data.get('action')
        
        if action == 'start_sequence':
            lead_id = data.get('lead_id', '')
            channel = data.get('channel', 'sms')
            steps = data.get('steps', 3)
            first_delay_minutes = data.get('first_delay_minutes', 5)
            cadence_minutes = data.get('cadence_minutes', 1440)
            meta = data.get('meta')
            
            result = lead_nurture.start_sequence(
                lead_id=lead_id,
                channel=channel,
                steps=steps,
                first_delay_minutes=first_delay_minutes,
                cadence_minutes=cadence_minutes,
                meta=meta
            )
            return jsonify({'success': True, 'result': result})
        
        elif action == 'next_message':
            sequence_id = data.get('sequence_id', '')
            result = lead_nurture.next_message(sequence_id=sequence_id)
            return jsonify({'success': True, 'result': result})
        
        else:
            return jsonify({'success': False, 'error': 'Invalid action. Use "start_sequence" or "next_message"'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5000)

