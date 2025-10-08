# Klean Waste Management System

A comprehensive waste management system with civilian reporting and driver dashboard for route optimization.

## Features

### Civilian Interface (`Civilian copy.html`)
- Photo upload with drag & drop support
- Interactive map for precise location marking
- Note submission for additional context
- Real-time location tracking with draggable markers

### Driver Dashboard (`klean.html`)
- Interactive route planning and optimization
- Real-time waste analytics
- Civilian reports management
- Map-based collection point management

### Backend System (`app.py`)
- Flask-based REST API
- JSON file storage for reports
- Image file management
- CORS enabled for frontend integration

## Setup Instructions

### Prerequisites
- Python 3.7+ installed
- Modern web browser with JavaScript enabled

### Quick Start

1. **Start the Backend Server**
   ```bash
   # Windows
   start_backend.bat
   
   # OR manually:
   python -m venv venv
   venv\Scripts\activate     # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   python app.py
   ```

2. **Access the Applications**
   - Civilian Interface: Open `Civilian copy.html` in your browser
   - Driver Dashboard: Open `klean.html` in your browser
   - Backend API: http://localhost:5000

### Backend API Endpoints

- `GET /api/reports` - Get all waste reports
- `POST /api/reports` - Submit a new waste report
- `POST /api/reports/{id}/approve` - Approve a specific report
- `GET /api/images/{filename}` - Serve uploaded images
- `GET /api/health` - Health check endpoint

## How It Works

### Civilian Workflow
1. **Take Photo**: Civilians capture images of waste spots
2. **Mark Location**: Drag the map marker to the exact location
3. **Add Notes**: Optional description of the waste issue
4. **Submit Report**: Data is sent to backend and stored locally as backup

### Driver Workflow
1. **View Reports**: All civilian reports appear in the Reports section
2. **Review Details**: See photos, locations, timestamps, and notes
3. **Approve Reports**: Click "Approve & Add to Map" to:
   - Mark the report as approved
   - Automatically add the location to the collection route
   - Enable route optimization

### Data Flow
```
Civilian Interface → Flask Backend → JSON Storage + Image Files
                  ↓
Driver Dashboard ← Flask Backend ← JSON Storage + Image Files
```

## File Structure

```
KleanV3/
├── app.py                 # Flask backend server
├── api.js                 # Frontend API helper functions
├── requirements.txt       # Python dependencies
├── start_backend.bat      # Windows startup script
├── Civilian copy.html     # Civilian reporting interface
├── klean.html            # Driver dashboard
├── script.js             # Dashboard JavaScript
├── styles.css            # Dashboard styles
└── data/                 # Created automatically
    ├── reports.json      # Stored waste reports
    └── images/           # Uploaded images
```

## Features

### Offline Support
- Both interfaces work with localStorage as backup
- Automatic fallback when backend is unavailable
- Data sync when backend comes back online

### Image Management
- Automatic image compression and format handling
- Unique filename generation to prevent conflicts
- Base64 fallback for offline functionality

### Map Integration
- Interactive Leaflet maps with custom markers
- Drag-and-drop location selection
- Automatic route optimization
- Real-time coordinate display

## Development

### Adding New Features
1. Update backend API in `app.py`
2. Extend frontend API helpers in `api.js`
3. Modify UI components in respective HTML files

### Database Integration
The current system uses JSON files. To integrate with a database:
1. Replace file operations in `app.py` with database calls
2. Add database connection configuration
3. Update data models as needed

## Troubleshooting

### Backend Won't Start
- Ensure Python 3.7+ is installed
- Check if port 5000 is available
- Verify all dependencies are installed

### Images Not Loading
- Check if backend server is running
- Verify `data/images/` directory exists
- Ensure proper CORS configuration

### Reports Not Syncing
- Confirm API endpoints are accessible
- Check browser console for errors
- Verify network connectivity to backend

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify backend logs for API errors
3. Ensure all file permissions are correct