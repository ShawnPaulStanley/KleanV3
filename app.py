#!/usr/bin/env python3
"""
Klean V3 - ESP32 Dustbin Monitoring Backend
Flask server to handle ESP32 sensor data and provide API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DUSTBIN_STATUS_FILE = 'dustbin_status.json'
LOG_FILE = 'dustbin_logs.json'

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
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'r') as f:
                logs = json.load(f)
        
        logs.append(log_entry)
        
        # Keep only last 1000 entries
        if len(logs) > 1000:
            logs = logs[-1000:]
        
        # Save logs
        with open(LOG_FILE, 'w') as f:
            json.dump(logs, f, indent=2)
            
        logger.info(f"Status change logged: {dustbin_id} {old_status} -> {new_status}")
    except Exception as e:
        logger.error(f"Error logging status change: {e}")

@app.route('/api/dustbin/status', methods=['POST'])
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

@app.route('/api/dustbin/status', methods=['GET'])
def get_dustbin_status():
    """Get current status of all dustbins"""
    try:
        data = load_dustbin_data()
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting dustbin status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/dustbin/logs', methods=['GET'])
def get_dustbin_logs():
    """Get dustbin status change logs"""
    try:
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'r') as f:
                logs = json.load(f)
            return jsonify({'logs': logs})
        else:
            return jsonify({'logs': []})
    except Exception as e:
        logger.error(f"Error getting dustbin logs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/dustbin/simulate', methods=['POST'])
def simulate_sensor_data():
    """Simulate ESP32 sensor data for testing"""
    try:
        data = request.get_json()
        dustbin_id = data.get('dustbin_id', '001')
        status = data.get('status', 'full')
        
        # Simulate ESP32 POST request
        return update_dustbin_status()
        
    except Exception as e:
        logger.error(f"Error simulating sensor data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Klean V3 Dustbin Monitor'
    })

if __name__ == '__main__':
    logger.info("Starting Klean V3 Dustbin Monitoring Server...")
    logger.info(f"Dustbin data file: {DUSTBIN_STATUS_FILE}")
    logger.info(f"Log file: {LOG_FILE}")
    
    # Initialize data file if it doesn't exist
    load_dustbin_data()
    
    app.run(debug=True, host='0.0.0.0', port=5000)