#!/bin/bash
# KleanV3 System Startup Script
# This script starts both the Flask backend and frontend HTTP server

echo "🚀 Starting KleanV3 Waste Management System..."
echo "================================================"

# Change to project directory
cd "$(dirname "$0")"

# Check if Flask is already running on port 5000
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 5000 already in use. Stopping existing process..."
    kill $(lsof -t -i:5000) 2>/dev/null
    sleep 2
fi

# Check if HTTP server is already running on port 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 8000 already in use. Stopping existing process..."
    kill $(lsof -t -i:8000) 2>/dev/null
    sleep 2
fi

# Start Flask backend
echo ""
echo "📡 Starting Flask Backend on port 5000..."
nohup python3 app.py > flask.log 2>&1 &
FLASK_PID=$!
echo "   Backend PID: $FLASK_PID"

# Wait for Flask to start
sleep 3

# Check if Flask started successfully
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend started successfully"
else
    echo "   ❌ Backend failed to start. Check flask.log for errors"
    exit 1
fi

# Start Frontend HTTP server
echo ""
echo "🌐 Starting Frontend HTTP Server on port 8000..."
nohup python3 -m http.server 8000 > http_server.log 2>&1 &
HTTP_PID=$!
echo "   Frontend PID: $HTTP_PID"

# Wait for HTTP server to start
sleep 2

# Check if HTTP server started successfully
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "   ✅ Frontend started successfully"
else
    echo "   ❌ Frontend failed to start. Check http_server.log for errors"
    exit 1
fi

echo ""
echo "================================================"
echo "✅ KleanV3 System Started Successfully!"
echo "================================================"
echo ""
echo "📍 Access Points:"
echo "   Backend API:     http://localhost:5000/api"
echo "   Admin Dashboard: http://localhost:8000/klean.html"
echo "   Civilian Report: http://localhost:8000/Civilian copy.html"
echo "   Test Interface:  http://localhost:8000/test.html"
echo ""
echo "📊 Health Check:"
curl -s http://localhost:5000/api/health | python3 -m json.tool | grep -E "status|service" | head -2
echo ""
echo "🔧 Process IDs:"
echo "   Flask Backend: $FLASK_PID"
echo "   HTTP Server:   $HTTP_PID"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f flask.log"
echo "   Frontend: tail -f http_server.log"
echo ""
echo "⏹️  To stop all services:"
echo "   kill $FLASK_PID $HTTP_PID"
echo "   or use: pkill -f 'python3 app.py' && pkill -f 'python3 -m http.server'"
echo ""
echo "🧪 To test ESP32 integration:"
echo "   python3 esp32_simulator.py test"
echo ""
