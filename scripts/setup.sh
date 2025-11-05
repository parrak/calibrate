#!/bin/bash
# scripts/setup.sh
# One-step bootstrap script for Calibrate monorepo (Bash version)
# Run from the repo root:
#   pnpm setup
#   # or directly:
#   bash scripts/setup.sh

set -e

DB_URL="postgresql://user:pass@localhost:5432/calibr"

write_step() {
    echo ""
    echo "=== $1 ==="
}

write_success() {
    echo "✅ $1"
}

write_warning() {
    echo "⚠️  $1"
}

write_error() {
    echo "❌ $1"
}

test_command() {
    command -v "$1" >/dev/null 2>&1
}

test_prerequisites() {
    write_step "Checking Prerequisites"
    
    # Check Node.js
    if test_command node; then
        NODE_VERSION=$(node --version)
        write_success "Node.js: $NODE_VERSION"
    else
        write_error "Node.js not found. Please install Node.js 20+ from https://nodejs.org"
        exit 1
    fi
    
    # Check pnpm
    if test_command pnpm; then
        PNPM_VERSION=$(pnpm --version)
        write_success "pnpm: $PNPM_VERSION"
    else
        write_error "pnpm not found. Install with: npm install -g pnpm"
        exit 1
    fi
    
    # Check Docker
    if test_command docker; then
        DOCKER_VERSION=$(docker --version)
        write_success "Docker: $DOCKER_VERSION"
    else
        write_warning "Docker not found. Database setup will be skipped. Install from https://docker.com"
    fi
    
    write_success "All prerequisites met"
}

start_database() {
    write_step "Starting Database (Docker Compose)"
    
    if ! test_command docker; then
        write_warning "Docker not available. Skipping database setup."
        write_warning "You'll need to set up PostgreSQL manually and update DATABASE_URL"
        return 0
    fi
    
    # Check if containers are already running
    if docker-compose ps --services --filter "status=running" 2>/dev/null | grep -q .; then
        write_success "Database containers already running"
        return 0
    fi
    
    echo "Starting Docker Compose..."
    docker-compose up -d
    
    # Wait a moment for database to be ready
    echo "Waiting for database to be ready..."
    sleep 3
    
    write_success "Database started successfully"
}

create_env_files() {
    write_step "Creating Environment Files"
    
    # Root .env
    if [ ! -f .env ]; then
        echo "Creating .env..."
        cat > .env <<EOF
# Calibrate Environment Variables
# This file is for root-level configuration
# Service-specific env vars should go in their respective .env.local files
DATABASE_URL=$DB_URL
NODE_ENV=development
EOF
        write_success "Created .env"
    else
        echo ".env already exists"
    fi
    
    # API .env.local
    if [ ! -f apps/api/.env.local ]; then
        echo "Creating apps/api/.env.local..."
        mkdir -p apps/api
        cat > apps/api/.env.local <<EOF
# API Service Environment Variables
DATABASE_URL=$DB_URL
NODE_ENV=development

# Optional: Webhook Secret (generate a secure random string)
# WEBHOOK_SECRET=your-secret-here

# Optional: Shopify Integration
# SHOPIFY_API_KEY=your-api-key
# SHOPIFY_API_SECRET=your-api-secret
# SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
# SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Optional: Amazon SP-API
# AMAZON_SP_APP_ID=amzn1.sp.solution.xxxxx
# AMAZON_LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
# AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxx
EOF
        write_success "Created apps/api/.env.local"
    else
        echo "apps/api/.env.local already exists"
    fi
    
    # Console .env.local
    if [ ! -f apps/console/.env.local ]; then
        echo "Creating apps/console/.env.local..."
        mkdir -p apps/console
        cat > apps/console/.env.local <<EOF
# Console Service Environment Variables
DATABASE_URL=$DB_URL
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001

# NextAuth Secret (generate with: openssl rand -base64 32)
# AUTH_SECRET=your-auth-secret-here
EOF
        write_success "Created apps/console/.env.local"
    else
        echo "apps/console/.env.local already exists"
    fi
    
    # Site .env.local
    if [ ! -f apps/site/.env.local ]; then
        echo "Creating apps/site/.env.local..."
        mkdir -p apps/site
        cat > apps/site/.env.local <<EOF
# Site Service Environment Variables
NEXT_PUBLIC_API_BASE=http://localhost:3000
EOF
        write_success "Created apps/site/.env.local"
    else
        echo "apps/site/.env.local already exists"
    fi
    
    write_success "Environment files ready"
}

install_dependencies() {
    write_step "Installing Dependencies"
    
    echo "Running: pnpm install"
    pnpm install
    
    write_success "Dependencies installed"
}

generate_prisma_client() {
    write_step "Generating Prisma Client"
    
    echo "Running: pnpm db:generate"
    pnpm db:generate
    
    write_success "Prisma client generated"
}

run_migrations() {
    write_step "Running Database Migrations"
    
    echo "Running: pnpm migrate"
    pnpm migrate
    
    write_success "Migrations completed"
}

seed_database() {
    write_step "Seeding Database"
    
    read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running: pnpm seed"
        pnpm seed || write_warning "Database seeding failed (this is optional)"
        write_success "Database seeded"
    else
        echo "Skipping database seed"
    fi
}

# Main execution
echo ""
echo "🚀 Calibrate Setup Script"
echo "========================"
echo ""

test_prerequisites
start_database
create_env_files
install_dependencies
generate_prisma_client
run_migrations
seed_database

echo ""
write_success "Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "  1. Update .env files with your API keys and secrets (if needed)"
echo "  2. Run 'pnpm dev:all' to start all development servers"
echo "  3. Visit http://localhost:3001 for the Console"
echo "  4. Visit http://localhost:3000 for the API"
echo ""

