#!/bin/bash

# Quick Start Script - Runs both backend and frontend in development mode
# Uses tmux to manage multiple terminals

set -e

echo "🐕 Starting Josie Tracker..."
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux not found. Please install tmux or run manually:"
    echo ""
    echo "Terminal 1: cd backend && npm run dev"
    echo "Terminal 2: cd frontend && npm run dev"
    exit 1
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo ""
    echo "Run ./setup.sh first to set up the project."
    exit 1
fi

# Start tmux session
SESSION="josie-tracker"

# Create new session
tmux new-session -d -s $SESSION

# Rename first window to "backend"
tmux rename-window -t $SESSION:0 'backend'

# Start backend in first pane
tmux send-keys -t $SESSION:0 "cd backend && npm run dev" C-m

# Create new window for frontend
tmux new-window -t $SESSION:1 -n 'frontend'

# Start frontend in second window
tmux send-keys -t $SESSION:1 "cd frontend && npm run dev" C-m

# Create new window for logs
tmux new-window -t $SESSION:2 -n 'logs'
tmux send-keys -t $SESSION:2 "echo 'Waiting for logs...' && sleep 3 && tail -f backend/logs/combined.log" C-m

echo "✅ Josie Tracker started in tmux session '$SESSION'"
echo ""
echo "Commands:"
echo "  tmux attach -t $SESSION    # Attach to session"
echo "  tmux kill-session -t $SESSION    # Stop all servers"
echo ""
echo "Windows:"
echo "  0: backend (http://localhost:3000)"
echo "  1: frontend (http://localhost:8000)"
echo "  2: logs"
echo ""
echo "Ctrl+B then:"
echo "  0-2: Switch windows"
echo "  D: Detach (keeps running)"
echo "  [: Scroll mode (Q to exit)"
echo ""
echo "Open http://localhost:8000 in your browser"
echo ""

# Attach to session
tmux attach -t $SESSION
