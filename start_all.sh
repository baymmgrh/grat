#!/bin/bash
echo "============================================================"
echo "  PT. Gratia Makmur Sentosa - ERP System"
echo "  Starting All Servers (Linux)"
echo "============================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start Backend
echo "Starting Backend Server..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

if ! python -c "import flask" 2>/dev/null; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
fi

python app.py &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Start Frontend
echo "Starting Frontend Server..."
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "============================================================"
echo "  Servers are running!"
echo ""
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "============================================================"
echo ""

# Trap Ctrl+C to kill both processes
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "All servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
