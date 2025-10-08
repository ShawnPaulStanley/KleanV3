from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import base64
import uuid
from datetime import datetime
import mimetypes

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
REPORTS_FILE = 'data/reports.json'
IMAGES_DIR = 'data/images'
DATA_DIR = 'data'

# Ensure data directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

def load_reports():
    """Load reports from JSON file"""
    if os.path.exists(REPORTS_FILE):
        with open(REPORTS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_reports(reports):
    """Save reports to JSON file"""
    with open(REPORTS_FILE, 'w') as f:
        json.dump(reports, f, indent=2)

def save_image(base64_data, report_id):
    """Save base64 image data to file and return filename"""
    try:
        # Extract image data and format
        if ',' in base64_data:
            header, data = base64_data.split(',', 1)
            # Extract format from header (e.g., "data:image/jpeg;base64")
            format_part = header.split(';')[0].split('/')[1]
        else:
            data = base64_data
            format_part = 'jpg'  # default
        
        # Generate unique filename
        filename = f"report_{report_id}_{uuid.uuid4().hex[:8]}.{format_part}"
        filepath = os.path.join(IMAGES_DIR, filename)
        
        # Decode and save image
        image_data = base64.b64decode(data)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        return filename
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get all reports"""
    try:
        reports = load_reports()
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports', methods=['POST'])
def submit_report():
    """Submit a new waste report"""
    try:
        data = request.json
        
        # Generate unique report ID
        report_id = int(datetime.now().timestamp() * 1000)
        
        # Save image if provided
        image_filename = None
        if 'photoData' in data and data['photoData']:
            image_filename = save_image(data['photoData'], report_id)
        
        # Create report object
        report = {
            'id': report_id,
            'location': data.get('location', {}),
            'notes': data.get('notes', ''),
            'timestamp': datetime.now().isoformat(),
            'status': 'reported',
            'image_filename': image_filename,
            'original_filename': data.get('fileName', 'unknown.jpg')
        }
        
        # Load existing reports and add new one
        reports = load_reports()
        reports.append(report)
        save_reports(reports)
        
        return jsonify({
            'success': True, 
            'message': 'Report submitted successfully',
            'report_id': report_id
        })
        
    except Exception as e:
        print(f"Error submitting report: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports/<int:report_id>/approve', methods=['POST'])
def approve_report(report_id):
    """Approve a waste report"""
    try:
        reports = load_reports()
        
        # Find and update the report
        for report in reports:
            if report['id'] == report_id:
                report['status'] = 'approved'
                report['approved_at'] = datetime.now().isoformat()
                break
        else:
            return jsonify({'success': False, 'error': 'Report not found'}), 404
        
        save_reports(reports)
        
        return jsonify({
            'success': True, 
            'message': 'Report approved successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/images/<filename>')
def serve_image(filename):
    """Serve uploaded images"""
    try:
        return send_from_directory(IMAGES_DIR, filename)
    except Exception as e:
        return jsonify({'error': 'Image not found'}), 404

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'reports_count': len(load_reports())
    })

if __name__ == '__main__':
    print("Starting Klean Waste Management Backend...")
    print(f"Reports will be stored in: {os.path.abspath(REPORTS_FILE)}")
    print(f"Images will be stored in: {os.path.abspath(IMAGES_DIR)}")
    app.run(debug=True, host='0.0.0.0', port=5000)