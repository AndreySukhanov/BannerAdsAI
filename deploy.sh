#!/bin/bash

# Deployment script for BannerAdsAI
# This script helps deploy the application to production

set -e

echo "🚀 Deploying BannerAdsAI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env_vars() {
    echo -e "${YELLOW}Checking environment variables...${NC}"
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${RED}Error: OPENAI_API_KEY is not set${NC}"
        echo "Please set your OpenAI API key:"
        echo "export OPENAI_API_KEY=sk-your-openai-key-here"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Environment variables OK${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    
    # Frontend dependencies
    echo "Installing frontend dependencies..."
    npm install
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Build frontend
build_frontend() {
    echo -e "${YELLOW}Building frontend...${NC}"
    npm run build
    echo -e "${GREEN}✓ Frontend built${NC}"
}

# Start services
start_services() {
    echo -e "${YELLOW}Starting services...${NC}"
    
    # Start backend in background
    cd backend
    nohup npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    echo "Backend started with PID: $BACKEND_PID"
    echo -e "${GREEN}✓ Backend running on port 3001${NC}"
    
    # Start frontend
    echo -e "${YELLOW}Starting frontend...${NC}"
    nohup npm run preview > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    echo "Frontend started with PID: $FRONTEND_PID"
    echo -e "${GREEN}✓ Frontend running on port 4173${NC}"
}

# Production deployment
deploy_production() {
    echo -e "${YELLOW}Production deployment mode${NC}"
    
    check_env_vars
    install_dependencies
    build_frontend
    start_services
    
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo -e "Frontend: ${GREEN}http://localhost:4173${NC}"
    echo -e "Backend API: ${GREEN}http://localhost:3001${NC}"
    echo ""
    echo "Logs:"
    echo "  Backend: tail -f backend.log"
    echo "  Frontend: tail -f frontend.log"
    echo ""
    echo "To stop services:"
    echo "  pkill -f 'npm start'"
    echo "  pkill -f 'npm run preview'"
}

# Development setup
setup_development() {
    echo -e "${YELLOW}Development setup mode${NC}"
    
    # Copy environment files if they don't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}Created .env file. Please edit it with your API keys.${NC}"
    fi
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        echo -e "${YELLOW}Created backend/.env file. Please edit it with your API keys.${NC}"
    fi
    
    install_dependencies
    
    echo -e "${GREEN}✓ Development setup completed!${NC}"
    echo ""
    echo "To start development:"
    echo "  1. Edit .env and backend/.env files with your API keys"
    echo "  2. Run: npm run dev (frontend)"
    echo "  3. Run: cd backend && npm run dev (backend)"
}

# Help function
show_help() {
    echo "BannerAdsAI Deployment Script"
    echo ""
    echo "Usage:"
    echo "  ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  prod    - Production deployment"
    echo "  dev     - Development setup"
    echo "  help    - Show this help message"
    echo ""
    echo "Environment variables required for production:"
    echo "  OPENAI_API_KEY - Your OpenAI API key"
}

# Main script logic
case "$1" in
    "prod")
        deploy_production
        ;;
    "dev")
        setup_development
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        echo -e "${YELLOW}No command specified. Use 'help' for options.${NC}"
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac