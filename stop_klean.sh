#!/bin/bash
# KleanV3 System Shutdown Script
# This script stops both the Flask backend and frontend HTTP server

echo "⏹️  Stopping KleanV3 Waste Management System..."
echo "================================================"

# Stop Flask backend on port 5000
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🛑 Stopping Flask Backend (port 5000)..."
    kill $(lsof -t -i:5000) 2>/dev/null
    echo "   ✅ Backend stopped"
else
    echo "ℹ️  Flask Backend not running"
fi

# Stop HTTP server on port 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🛑 Stopping Frontend HTTP Server (port 8000)..."
    kill $(lsof -t -i:8000) 2>/dev/null
    echo "   ✅ Frontend stopped"
else
    echo "ℹ️  Frontend HTTP Server not running"
fi

# Additional cleanup - kill any remaining python processes related to the project
pkill -f 'python3 app.py' 2>/dev/null
pkill -f 'python3 -m http.server 8000' 2>/dev/null

echo ""
echo "================================================"
echo "✅ KleanV3 System Stopped Successfully!"
echo "================================================"
