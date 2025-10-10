#!/bin/bash
# Quick Start Script for Klean V3

echo "🚀 Starting Klean V3..."
cd "$(dirname "$0")"

# Kill any existing processes
pkill -f "python3 app.py" 2>/dev/null
pkill -f "python3 -m http.server" 2>/dev/null
sleep 1

# Start Flask backend
echo "✓ Starting Flask (port 5000)..."
python3 app.py > flask.log 2>&1 &
sleep 2

# Start HTTP server
echo "✓ Starting HTTP server (port 8000)..."
python3 -m http.server 8000 > http.log 2>&1 &
sleep 1

echo ""
echo "✅ Servers Running!"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:8000/klean.html"
echo ""
echo "   Stop: ./quick_stop.sh"
