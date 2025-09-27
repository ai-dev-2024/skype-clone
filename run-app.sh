#!/bin/bash

# Skype Clone Application Startup Script
echo "🚀 Starting Skype Clone Application..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   sudo systemctl start mongod  # Linux"
    echo "   brew services start mongodb-community  # macOS"
    echo "   Or use MongoDB Docker: docker run -d -p 27017:27017 mongo:latest"
    exit 1
fi

echo "✅ MongoDB is running"

# Start backend server
echo "🔧 Starting backend server..."
cd packages/backend
npm start &
BACKEND_PID=$!
cd ../..

echo "✅ Backend server started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check if backend is responding
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend failed to start. Check logs."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend development server
echo "🎨 Starting frontend development server..."
cd packages/web
npm run dev &
FRONTEND_PID=$!
cd ../..

echo "✅ Frontend development server started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Skype Clone is now running!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo ""
echo "🔧 To stop the application:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📚 Documentation:"
echo "   AGENTS.md - Agent coordination guide"
echo "   COORDINATION.md - Multi-agent development strategy"
echo "   README.md - Project overview"
echo ""

# Keep script running
wait
