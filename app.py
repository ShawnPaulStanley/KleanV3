#!/usr/bin/env python3
"""
Klean - Unified Waste Management System
Combines waste reporting and dustbin monitoring functionality
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import base64
import uuid
from datetime import datetime
import mimetypes
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
REPORTS_FILE = 'data/reports.json'
IMAGES_DIR = 'data/images'
DATA_DIR = 'data'
DUSTBIN_STATUS_FILE = 'data/dustbin_status.json'
DUSTBIN_LOG_FILE = 'data/dustbin_logs.json'

# Ensure data directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# ============= WASTE REPORTS FUNCTIONALITY =============

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
        logger.error(f"Error saving image: {e}")
        return None

# ============= DUSTBIN MONITORING FUNCTIONALITY =============

def load_dustbin_data():
    """Load dustbin status data from JSON file"""
    try:
        if os.path.exists(DUSTBIN_STATUS_FILE):
            with open(DUSTBIN_STATUS_FILE, 'r') as f:
                return json.load(f)
        else:
            # Create initial data structure with sample dustbins
            initial_data = {
                "dustbins": {
                    "001": {
                        "id": "001",
                        "location": {
                            "lat": 17.5449,
                            "lng": 78.5718,
                            "name": "Main Library - Dustbin 1"
                        },
                        "status": "empty",
                        "last_updated": datetime.now().isoformat(),
                        "sensor_type": "ultrasonic",
                        "battery_level": 85
                    },
                    "002": {
                        "id": "002", 
                        "location": {
                            "lat": 17.5454,
                            "lng": 78.5720,
                            "name": "Mess Area - Dustbin 2"
                        },
                        "status": "empty",
                        "last_updated": datetime.now().isoformat(),
                        "sensor_type": "ultrasonic",
                        "battery_level": 92
                    },
                    "003": {
                        "id": "003",
                        "location": {
                            "lat": 17.5442,
                            "lng": 78.5715,
                            "name": "Hostel Block - Dustbin 3"
                        },
                        "status": "empty",
                        "last_updated": datetime.now().isoformat(),
                        "sensor_type": "ultrasonic",
                        "battery_level": 78
                    }
                },
                "last_sync": datetime.now().isoformat()
            }
            save_dustbin_data(initial_data)
            return initial_data
    except Exception as e:
        logger.error(f"Error loading dustbin data: {e}")
        return {"dustbins": {}, "last_sync": datetime.now().isoformat()}

def save_dustbin_data(data):
    """Save dustbin status data to JSON file"""
    try:
        data["last_sync"] = datetime.now().isoformat()
        with open(DUSTBIN_STATUS_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info("Dustbin data saved successfully")
    except Exception as e:
        logger.error(f"Error saving dustbin data: {e}")

def log_status_change(dustbin_id, old_status, new_status):
    """Log status changes for analytics"""
    try:
        log_entry = {
            "dustbin_id": dustbin_id,
            "old_status": old_status,
            "new_status": new_status,
            "timestamp": datetime.now().isoformat()
        }
        
        # Load existing logs
        logs = []
        if os.path.exists(DUSTBIN_LOG_FILE):
            with open(DUSTBIN_LOG_FILE, 'r') as f:
                logs = json.load(f)
        
        logs.append(log_entry)
        
        # Keep only last 1000 entries
        if len(logs) > 1000:
            logs = logs[-1000:]
        
        # Save logs
        with open(DUSTBIN_LOG_FILE, 'w') as f:
            json.dump(logs, f, indent=2)
            
        logger.info(f"Status change logged: {dustbin_id} {old_status} -> {new_status}")
    except Exception as e:
        logger.error(f"Error logging status change: {e}")

# ============= API ENDPOINTS =============

# Waste Reports Endpoints
@app.route('/reports', methods=['GET'])
def get_reports():
    """Get all reports"""
    try:
        reports = load_reports()
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/reports', methods=['POST'])
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
        logger.error(f"Error submitting report: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/reports/<int:report_id>/approve', methods=['POST'])
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

@app.route('/images/<filename>')
def serve_image(filename):
    """Serve uploaded images"""
    try:
        return send_from_directory(IMAGES_DIR, filename)
    except Exception as e:
        return jsonify({'error': 'Image not found'}), 404

# Dustbin Monitoring Endpoints
@app.route('/dustbins/status', methods=['POST'])
def update_dustbin_status():
    """
    Endpoint to receive ESP32 sensor data
    Expected payload: {"dustbin_id": "001", "status": "full"/"empty", "battery_level": 85}
    """
    try:
        data = request.get_json()
        
        # Validate request data
        if not data or 'dustbin_id' not in data or 'status' not in data:
            return jsonify({
                'error': 'Missing required fields: dustbin_id and status'
            }), 400
        
        dustbin_id = data['dustbin_id']
        new_status = data['status']
        battery_level = data.get('battery_level', None)
        
        # Validate status
        if new_status not in ['full', 'empty', 'partial']:
            return jsonify({
                'error': 'Invalid status. Must be "full", "empty", or "partial"'
            }), 400
        
        # Load current data
        dustbin_data = load_dustbin_data()
        
        # Check if dustbin exists
        if dustbin_id not in dustbin_data['dustbins']:
            # Create new dustbin entry
            dustbin_data['dustbins'][dustbin_id] = {
                "id": dustbin_id,
                "location": {
                    "lat": 17.5449,  # Default location - should be updated
                    "lng": 78.5718,
                    "name": f"Dustbin {dustbin_id}"
                },
                "status": new_status,
                "last_updated": datetime.now().isoformat(),
                "sensor_type": "ultrasonic",
                "battery_level": battery_level or 100
            }
            logger.info(f"Created new dustbin entry: {dustbin_id}")
        else:
            # Update existing dustbin
            old_status = dustbin_data['dustbins'][dustbin_id]['status']
            dustbin_data['dustbins'][dustbin_id]['status'] = new_status
            dustbin_data['dustbins'][dustbin_id]['last_updated'] = datetime.now().isoformat()
            
            if battery_level is not None:
                dustbin_data['dustbins'][dustbin_id]['battery_level'] = battery_level
            
            # Log status change if different
            if old_status != new_status:
                log_status_change(dustbin_id, old_status, new_status)
        
        # Save updated data
        save_dustbin_data(dustbin_data)
        
        logger.info(f"Updated dustbin {dustbin_id}: status={new_status}")
        
        return jsonify({
            'success': True,
            'dustbin_id': dustbin_id,
            'status': new_status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error updating dustbin status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/dustbins/status', methods=['GET'])
def get_dustbin_status():
    """Get current status of all dustbins"""
    try:
        data = load_dustbin_data()
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting dustbin status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/dustbins/logs', methods=['GET'])
def get_dustbin_logs():
    """Get dustbin status change logs"""
    try:
        if os.path.exists(DUSTBIN_LOG_FILE):
            with open(DUSTBIN_LOG_FILE, 'r') as f:
                logs = json.load(f)
            return jsonify({'logs': logs})
        else:
            return jsonify({'logs': []})
    except Exception as e:
        logger.error(f"Error getting dustbin logs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/dustbins/simulate', methods=['POST'])
def simulate_sensor_data():
    """Simulate ESP32 sensor data for testing"""
    try:
        data = request.get_json()
        dustbin_id = data.get('dustbin_id', '001')
        status = data.get('status', 'full')
        
        # Update request data for simulation
        request.json = data
        return update_dustbin_status()
        
    except Exception as e:
        logger.error(f"Error simulating sensor data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Dashboard/Analytics Endpoints
@app.route('/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get summary data for dashboard"""
    try:
        reports = load_reports()
        dustbin_data = load_dustbin_data()
        
        # Count reports by status
        report_stats = {'reported': 0, 'approved': 0}
        for report in reports:
            status = report.get('status', 'reported')
            report_stats[status] = report_stats.get(status, 0) + 1
        
        # Count dustbins by status
        dustbin_stats = {'full': 0, 'empty': 0, 'partial': 0}
        low_battery_count = 0
        
        for dustbin in dustbin_data.get('dustbins', {}).values():
            status = dustbin.get('status', 'empty')
            dustbin_stats[status] = dustbin_stats.get(status, 0) + 1
            
            if dustbin.get('battery_level', 100) < 20:
                low_battery_count += 1
        
        return jsonify({
            'success': True,
            'summary': {
                'reports': {
                    'total': len(reports),
                    'by_status': report_stats
                },
                'dustbins': {
                    'total': len(dustbin_data.get('dustbins', {})),
                    'by_status': dustbin_stats,
                    'low_battery': low_battery_count
                }
            }
        })
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    dustbin_data = load_dustbin_data()
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Klean Unified Waste Management System',
        'reports_count': len(load_reports()),
        'dustbins_count': len(dustbin_data.get('dustbins', {}))
    })

if __name__ == '__main__':
    logger.info("Starting Klean Unified Waste Management System...")
    logger.info(f"Reports will be stored in: {os.path.abspath(REPORTS_FILE)}")
    logger.info(f"Images will be stored in: {os.path.abspath(IMAGES_DIR)}")
    logger.info(f"Dustbin data will be stored in: {os.path.abspath(DUSTBIN_STATUS_FILE)}")
    logger.info(f"Dustbin logs will be stored in: {os.path.abspath(DUSTBIN_LOG_FILE)}")
    
    # Initialize data files if they don't exist
    load_dustbin_data()
    
    app.run(debug=True, host='0.0.0.0', port=5000)