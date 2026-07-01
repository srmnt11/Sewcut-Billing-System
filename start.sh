#!/bin/bash
# Quick start script for Sewcut Billing System

echo "🚀 Starting Sewcut Billing System..."
echo ""

# Check if we're in the right directory
if [ ! -d "sewcut-backend" ] || [ ! -d "sewcut-frontend" ]; then
    echo "❌ Error: Please run this script from the 'Sewcut Billing System' directory"
    exit 1
fi

# Start backend
echo "📦 Starting Backend (Django)..."
cd sewcut-backend
python manage.py runserver &
BACKEND_PID=$!
celery -A sewcut worker -l info &
WORKER_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend (React)..."
cd sewcut-frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "📋 Server Information:"
echo "   Backend:  http://127.0.0.1:8000"
echo "   Frontend: http://localhost:5173 (check terminal for actual port)"
echo "   Admin:    http://127.0.0.1:8000/admin"
echo ""
echo "🔑 Default Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $WORKER_PID $FRONTEND_PID; exit" INT
wait
