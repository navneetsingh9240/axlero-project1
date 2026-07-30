#!/bin/bash
cd /app
# Kill any existing node servers
pkill -f node || true
sleep 1

cd backend
npm install y-protocols
PORT=3001 node server.js > ../backend_log.txt 2>&1 &

cd ../frontend
npm run dev -- --port 3000 > ../frontend_log.txt 2>&1 &
