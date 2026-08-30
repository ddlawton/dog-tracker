#!/bin/bash

# Quick stop script - kills tmux session

SESSION="josie-tracker"

if tmux has-session -t $SESSION 2>/dev/null; then
    echo "🛑 Stopping Josie Tracker..."
    tmux kill-session -t $SESSION
    echo "✅ Stopped"
else
    echo "No active session found"
fi
