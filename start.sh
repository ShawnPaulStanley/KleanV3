#!/bin/bash

# Klean V3 - ESP32 Dustbin Monitoring System Startup Script

echo "🚀 Starting Klean V3 - ESP32 Dustbin Monitoring System"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Start Flask server in background
echo "🌐 Starting Flask backend server..."
python3 app.py &
FLASK_PID=$!

# Wait for Flask server to start
echo "⏳ Waiting for Flask server to start..."
sleep 3

# Check if Flask server is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Flask server is running successfully!"
else
    echo "❌ Flask server failed to start"
    kill $FLASK_PID 2>/dev/null
    exit 1
fi

# Open the web application
echo "🌍 Opening Klean V3 in your default browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000/klean.html
elif command -v open &> /dev/null; then
    open http://localhost:8000/klean.html
else
    echo "Please open http://localhost:8000/klean.html in your browser"
fi

# Start simple HTTP server for frontend
echo "🖥️  Starting frontend server..."
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
else
    echo "❌ Cannot start frontend server"
    kill $FLASK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Klean V3 is now running!"
echo "📊 Main App: http://localhost:8000/klean.html"
echo "🧪 System Test: http://localhost:8000/test.html"
echo "🔧 Backend API: http://localhost:5000/api"
echo ""
echo "💡 To test the ESP32 integration:"
echo "   python3 esp32_simulator.py test"
echo "   python3 esp32_simulator.py full 001"
echo "   python3 esp32_simulator.py empty 001"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C to kill background processes
trap 'echo ""; echo "🛑 Stopping services..."; kill $FLASK_PID $FRONTEND_PID 2>/dev/null; echo "✅ All services stopped"; exit 0' INT

# Wait for user to stop
wait