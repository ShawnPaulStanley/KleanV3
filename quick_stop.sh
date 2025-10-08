#!/bin/bash
# Quick Stop Script for Klean V3

echo "🛑 Stopping Klean V3..."

# Stop Flask backend
pkill -f "python3 app.py" 2>/dev/null

# Stop HTTP server
pkill -f "python3 -m http.server" 2>/dev/null

sleep 1
echo "✅ All servers stopped."
