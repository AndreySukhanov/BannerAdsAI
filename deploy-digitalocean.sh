#!/bin/bash

# DigitalOcean VPS Deployment Script for BannerAdsAI
# Этот скрипт автоматизирует деплой на VPS DigitalOcean

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 BannerAdsAI - DigitalOcean VPS Deployment${NC}"
echo "=================================================="

# Configuration
PROJECT_NAME="banneradsai"
DOMAIN=${DOMAIN:-"your-domain.com"}
EMAIL=${EMAIL:-"admin@your-domain.com"}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        echo "Run: sudo $0"
        exit 1
    fi
}

# Update system
update_system() {
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    log_success "System updated"
}

# Install Docker and Docker Compose
install_docker() {
    log_info "Installing Docker and Docker Compose..."
    
    # Remove old Docker versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install dependencies
    apt install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add user to docker group (if not root)
    if [ "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
    fi
    
    log_success "Docker installed successfully"
}

# Install additional tools
install_tools() {
    log_info "Installing additional tools..."
    
    apt install -y \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        htop \
        git \
        wget \
        curl \
        unzip
        
    log_success "Additional tools installed"
}

# Setup firewall
setup_firewall() {
    log_info "Setting up firewall..."
    
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22
    
    # Allow HTTP and HTTPS
    ufw allow 80
    ufw allow 443
    
    # Allow our application ports (if needed for direct access)
    ufw allow 3001
    ufw allow 4173
    
    ufw --force enable
    
    log_success "Firewall configured"
}

# Create application directory
create_app_directory() {
    log_info "Creating application directory..."
    
    mkdir -p /opt/$PROJECT_NAME
    mkdir -p /opt/$PROJECT_NAME/logs
    mkdir -p /opt/$PROJECT_NAME/ssl
    
    log_success "Application directory created"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Copy files (assumes you've uploaded them to /tmp/)
    if [ -d "/tmp/banneradsai" ]; then
        cp -r /tmp/banneradsai/* /opt/$PROJECT_NAME/
    else
        log_error "Application files not found in /tmp/banneradsai"
        log_info "Please upload your files to /tmp/banneradsai first"
        exit 1
    fi
    
    # Set permissions
    chown -R root:root /opt/$PROJECT_NAME
    chmod +x /opt/$PROJECT_NAME/deploy.sh
    
    cd /opt/$PROJECT_NAME
    
    # Create environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        log_warning "Please edit /opt/$PROJECT_NAME/.env with your API keys"
    fi
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        log_warning "Please edit /opt/$PROJECT_NAME/backend/.env with your API keys"
    fi
    
    log_success "Application deployed"
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    if [ "$DOMAIN" != "your-domain.com" ]; then
        certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
        log_success "SSL certificate configured"
    else
        log_warning "Skipping SSL setup - please set DOMAIN environment variable"
        log_info "Run: DOMAIN=yourdomain.com EMAIL=your@email.com $0"
    fi
}

# Configure Nginx
configure_nginx() {
    log_info "Configuring Nginx..."
    
    # Backup original config
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Use our custom config
    cp /opt/$PROJECT_NAME/nginx.conf /etc/nginx/sites-available/$PROJECT_NAME
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log_success "Nginx configured"
}

# Start application
start_application() {
    log_info "Starting application with Docker Compose..."
    
    cd /opt/$PROJECT_NAME
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start
    docker-compose up -d --build
    
    # Wait a moment for services to start
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Application started successfully"
    else
        log_error "Application failed to start"
        docker-compose logs
        exit 1
    fi
}

# Setup systemd service for auto-start
setup_systemd() {
    log_info "Setting up systemd service..."
    
    cat > /etc/systemd/system/$PROJECT_NAME.service << EOF
[Unit]
Description=BannerAdsAI Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=/opt/$PROJECT_NAME
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable $PROJECT_NAME
    
    log_success "Systemd service configured"
}

# Main deployment function
main() {
    echo -e "${YELLOW}Starting deployment...${NC}"
    
    check_root
    update_system
    install_docker
    install_tools
    setup_firewall
    create_app_directory
    deploy_application
    configure_nginx
    start_application
    setup_systemd
    
    if [ "$DOMAIN" != "your-domain.com" ]; then
        setup_ssl
    fi
    
    echo -e "${GREEN}"
    echo "🎉 Deployment completed successfully!"
    echo "=================================================="
    echo "Your BannerAdsAI application is now running!"
    echo ""
    echo "Access your application:"
    if [ "$DOMAIN" != "your-domain.com" ]; then
        echo "  🌐 https://$DOMAIN"
    else
        echo "  🌐 http://$(curl -s ifconfig.me)"
    fi
    echo ""
    echo "Useful commands:"
    echo "  📊 Check status: docker-compose ps"
    echo "  📋 View logs: docker-compose logs"
    echo "  🔄 Restart: systemctl restart $PROJECT_NAME"
    echo "  🛑 Stop: systemctl stop $PROJECT_NAME"
    echo ""
    echo "Configuration files:"
    echo "  ⚙️  App config: /opt/$PROJECT_NAME/.env"
    echo "  ⚙️  Backend config: /opt/$PROJECT_NAME/backend/.env"
    echo "  🌐 Nginx config: /etc/nginx/sites-available/$PROJECT_NAME"
    echo ""
    echo -e "${YELLOW}Don't forget to:"
    echo "1. Edit your .env files with real API keys"
    echo "2. Configure your domain DNS to point to this server"
    echo -e "${NC}"
}

# Help function
show_help() {
    echo "BannerAdsAI DigitalOcean Deployment Script"
    echo ""
    echo "Usage:"
    echo "  sudo ./deploy-digitalocean.sh"
    echo ""
    echo "Environment variables:"
    echo "  DOMAIN=your-domain.com     - Your domain name"
    echo "  EMAIL=your@email.com       - Your email for SSL certificate"
    echo ""
    echo "Example:"
    echo "  DOMAIN=bannerads.com EMAIL=admin@bannerads.com sudo ./deploy-digitalocean.sh"
}

# Check command line arguments
case "$1" in
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac