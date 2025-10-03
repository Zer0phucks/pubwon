#!/bin/bash

# PubWon - Initialization Script
# Gracefully sets up the development environment, runs tests, and starts servers

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    PubWon Initialization                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if .env file exists
print_step "Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    if [ -f ".env.example" ]; then
        print_step "Creating .env from .env.example"
        cp .env.example .env
        print_success ".env file created"
        print_warning "Please update .env with your actual credentials before continuing"
        read -p "Press Enter to continue after updating .env..."
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Check if node_modules exists
print_step "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_step "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Run TypeScript type checking
print_step "Running TypeScript type checking..."
if npm run type-check; then
    print_success "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

# Run linter
print_step "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting warnings found (non-blocking)"
fi

# Run tests
print_step "Running test suite..."
if npm test; then
    print_success "All tests passed"
else
    print_error "Some tests failed"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  Initialization Complete!                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run test         - Run tests"
echo "  npm run test:watch   - Run tests in watch mode"
echo "  npm run lint         - Run linter"
echo "  npm run db:studio    - Open Drizzle Studio"
echo ""

# Offer to start development server
read -p "Start development server now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_step "Starting development server..."
    npm run dev
fi
