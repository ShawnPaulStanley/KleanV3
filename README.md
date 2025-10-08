# Klean V3 - ESP32 Dustbin Monitoring System

![Klean V3 Logo](https://img.shields.io/badge/Klean-V3-red?style=for-the-badge&logo=recycle)

A comprehensive waste collection route optimization system with real-time ESP32 sensor integration for smart dustbin monitoring.

## 🚀 Features

### Core Features
- **🗺️ Interactive Map Interface** - Leaflet-based map with point selection
- **🛣️ Route Optimization** - OpenRouteService integration for optimal collection routes
- **📊 Analytics Dashboard** - Comprehensive waste collection analytics
- **🏫 University Integration** - Hostel and mess-specific waste tracking

### ESP32 Sensor Integration (NEW!)
- **📡 Real-time Sensor Monitoring** - 15-second polling of dustbin status
- **🚨 Automatic Route Updates** - Auto-add full dustbins to collection routes
- **🔔 Smart Notifications** - Real-time alerts for dustbin status changes
- **🎯 Sensor Markers** - Special pulsing markers for sensor-enabled dustbins
- **🔋 Battery Monitoring** - Track sensor health and battery levels

## 📁 Project Structure

```
KleanV3/
├── index.html              # Landing page
├── klean.html              # Main application
├── script.js               # Frontend JavaScript with ESP32 integration
├── styles.css              # Enhanced styles with sensor UI
├── app.py                  # Flask backend server
├── dustbin_status.json     # Sensor dustbin data storage
├── requirements.txt        # Python dependencies
├── esp32_simulator.py      # ESP32 sensor simulator for testing
├── start.sh               # System startup script
└── TODO.md                # Implementation roadmap
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.7+
- pip3
- Modern web browser
- Internet connection (for map tiles and route service)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KleanV3
   ```

2. **Run the startup script**
   ```bash
   ./start.sh
   ```

3. **Open your browser**
   - Navigate to `http://localhost:8000/klean.html`
   - Backend API runs on `http://localhost:5000`

### Manual Setup

1. **Install Python dependencies**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Start the Flask backend**
   ```bash
   python3 app.py
   ```

3. **Start the frontend server**
   ```bash
   python3 -m http.server 8000
   ```

4. **Access the application**
   - Frontend: `http://localhost:8000/klean.html`
   - Backend: `http://localhost:5000/api`

## 🧪 Testing ESP32 Integration

### ESP32 Simulator

Use the included simulator to test the ESP32 integration:

```bash
# Quick test - send one reading per dustbin
python3 esp32_simulator.py test

# Run continuous simulation (60 minutes, 30-second intervals)
python3 esp32_simulator.py sim 60 30

# Make specific dustbin full for testing
python3 esp32_simulator.py full 001

# Make specific dustbin empty for testing
python3 esp32_simulator.py empty 001
```

### Real ESP32 Integration

To integrate with actual ESP32 devices, send POST requests to:

**Endpoint:** `POST http://localhost:5000/api/dustbin/status`

**Payload:**
```json
{
  "dustbin_id": "001",
  "status": "full",
  "battery_level": 85,
  "capacity_percentage": 95
}
```

**Status Values:**
- `"empty"` - 0-39% full
- `"partial"` - 40-84% full  
- `"full"` - 85-100% full

## 📡 API Documentation

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dustbin/status` | Get all dustbin statuses |
| POST | `/api/dustbin/status` | Update dustbin status (ESP32) |
| GET | `/api/dustbin/logs` | Get status change logs |
| POST | `/api/dustbin/simulate` | Simulate sensor data |

### Dustbin Data Structure

```json
{
  "dustbins": {
    "001": {
      "id": "001",
      "location": {
        "lat": 17.5449,
        "lng": 78.5718,
        "name": "Main Library - Sensor Dustbin 1"
      },
      "status": "empty",
      "last_updated": "2025-10-08T12:00:00.000Z",
      "sensor_type": "ultrasonic",
      "battery_level": 85,
      "capacity_percentage": 15,
      "sensor_health": "good"
    }
  }
}
```

## 🎮 User Interface

### Main Features
- **📍 Point Selection** - Click on map to add collection points
- **🗑️ Waste Entry Modal** - Detailed waste data collection
- **📊 Analytics Panel** - Real-time statistics and insights
- **🎛️ Control Panel** - Route management and system controls

### ESP32 Features  
- **🔴 Sensor Markers** - Pulsing red markers for full dustbins
- **🟠 Partial Markers** - Orange markers for partial dustbins  
- **🟢 Empty Markers** - Green markers for empty dustbins
- **🔔 Notifications** - Toast notifications for status changes
- **📊 Sensor Dashboard** - Real-time sensor overview panel

## 🔧 Configuration

### Environment Variables
```bash
FLASK_ENV=development          # Flask environment
FLASK_DEBUG=1                  # Enable debug mode
DUSTBIN_POLLING_INTERVAL=15000 # Polling interval in milliseconds
```

### Customization
- Modify `dustbin_status.json` to add more sensor locations
- Update `DUSTBIN_API_BASE` in script.js for production deployment
- Adjust `POLLING_INTERVAL` for different update frequencies

## 🏗️ Architecture

### System Components
1. **Frontend (JavaScript/HTML/CSS)**
   - Leaflet map integration
   - Real-time ESP32 data polling
   - Route optimization UI

2. **Backend (Flask/Python)**  
   - RESTful API for sensor data
   - JSON-based data persistence
   - CORS-enabled for development

3. **ESP32 Integration**
   - HTTP POST communication
   - JSON data format
   - Real-time status updates

### Data Flow
```
ESP32 Sensor → Flask API → JSON Storage → Frontend Polling → Map Updates → Route Recalculation
```

## 🚧 Development Roadmap

See [TODO.md](./TODO.md) for detailed implementation roadmap and current status.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**ESP32 sensors not connecting:**
- Check if Flask server is running on port 5000
- Verify ESP32 network connectivity
- Ensure correct API endpoint URL

**Frontend not updating:**
- Check browser console for JavaScript errors
- Verify Flask server CORS configuration
- Clear browser cache and reload

**Route optimization not working:**
- Verify OpenRouteService API key in script.js
- Check internet connectivity
- Ensure valid coordinates are selected

### Debug Mode

Enable debug mode for detailed logging:
```bash
export FLASK_DEBUG=1
python3 app.py
```

## 📞 Support

- **Issues:** Open a GitHub issue
- **Documentation:** Check IMPLEMENTATION_SUMMARY.md for complete details
- **ESP32 Integration:** Use the simulator for testing before hardware deployment
- **System Testing:** Visit http://localhost:8000/test.html for real-time monitoring

## 🎉 Implementation Status

**✅ COMPLETED!** The ESP32 dustbin monitoring system is fully implemented and ready for production use.

### What's Working:
- ✅ Real-time sensor data collection
- ✅ Automatic route optimization
- ✅ Smart notifications
- ✅ Comprehensive testing tools
- ✅ Complete documentation
- ✅ Hardware integration template

---

**Klean V3** - Smart waste collection with ESP32 IoT integration is now LIVE! 🚀🗑️♻️