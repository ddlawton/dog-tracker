#!/bin/bash

# Josie Tracker - Complete Setup Script
# This script sets up both backend and frontend for development

set -e

echo "🐕 Josie Tracker - Setup Script"
echo "================================"
echo ""

# Check Node version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. You have: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"
echo ""

# Check PostgreSQL
echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL server is installed and running."
else
    echo "✅ PostgreSQL found"
fi
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your PostgreSQL credentials!"
else
    echo ".env already exists"
fi

echo "Installing backend dependencies..."
npm install
echo "✅ Backend setup complete"
echo ""

# Frontend setup
cd ../frontend
echo "📦 Setting up frontend..."

if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
fi

echo "Installing frontend dependencies..."
npm install
echo "✅ Frontend setup complete"
echo ""

# Create logs directory
cd ..
mkdir -p backend/logs
echo "✅ Created logs directory"
echo ""

# Summary
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit backend/.env with your PostgreSQL credentials:"
echo "   nano backend/.env"
echo ""
echo "2. Start the backend (Terminal 1):"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the frontend (Terminal 2):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:8000 in your browser"
echo ""
echo "For production deployment, see DEPLOYMENT.md"
echo ""
