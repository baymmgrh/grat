#!/bin/bash
echo "========================================"
echo "  Starting Frontend Development Server"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting Vite development server..."
echo ""
npm run dev
