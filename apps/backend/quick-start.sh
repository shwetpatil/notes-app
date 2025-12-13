#!/bin/bash

# Backend Quick Start with Vertical Scaling
# This script helps you quickly start the backend in different modes

set -e

echo "🚀 Notes Backend - Quick Start"
echo "================================"
echo ""

# Function to check if .env exists
check_env_file() {
    if [ ! -f .env ]; then
        echo "⚠️  .env file not found!"
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ .env file created. Please review and update it before running in production."
        echo ""
    fi
}

# Function to display menu
show_menu() {
    echo "Select startup mode:"
    echo ""
    echo "  1) Development - Single Instance (default)"
    echo "  2) Development - Cluster Mode (multi-core)"
    echo "  3) Production - Single Instance"
    echo "  4) Production - Cluster Mode (recommended)"
    echo "  5) Docker Development"
    echo "  6) Docker Production (with scaling)"
    echo "  7) Exit"
    echo ""
}

# Function to start development single instance
start_dev_single() {
    echo "🔧 Starting development server (single instance)..."
    pnpm dev
}

# Function to start development cluster
start_dev_cluster() {
    echo "🔧 Starting development server (cluster mode)..."
    echo "📊 This will utilize all available CPU cores"
    pnpm dev:cluster
}

# Function to start production single instance
start_prod_single() {
    echo "🏭 Building for production..."
    pnpm build
    echo "✅ Build complete"
    echo "🚀 Starting production server (single instance)..."
    pnpm start
}

# Function to start production cluster
start_prod_cluster() {
    echo "🏭 Building for production..."
    pnpm build
    echo "✅ Build complete"
    echo "🚀 Starting production server (cluster mode)..."
    echo "📊 This will utilize all available CPU cores"
    pnpm start:cluster
}

# Function to start docker development
start_docker_dev() {
    echo "🐳 Starting with Docker (development)..."
    pnpm docker:up
    echo "✅ Docker containers started"
    echo "📝 Run 'pnpm docker:logs' to view logs"
}

# Function to start docker production
start_docker_prod() {
    echo "🐳 Building and starting with Docker (production with scaling)..."
    echo "⚠️  Make sure you have configured .env.prod.example and renamed it to .env.prod"
    
    if [ ! -f .env.prod ]; then
        echo "❌ .env.prod file not found!"
        echo "📝 Please create .env.prod from .env.prod.example"
        exit 1
    fi
    
    pnpm docker:prod:build
    pnpm docker:prod:up
    echo "✅ Docker containers started"
    echo "📝 Run 'pnpm docker:prod:logs' to view logs"
}

# Main script
check_env_file

if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Enter your choice (1-7): " choice
        echo ""
        
        case $choice in
            1)
                start_dev_single
                break
                ;;
            2)
                start_dev_cluster
                break
                ;;
            3)
                start_prod_single
                break
                ;;
            4)
                start_prod_cluster
                break
                ;;
            5)
                start_docker_dev
                break
                ;;
            6)
                start_docker_prod
                break
                ;;
            7)
                echo "👋 Exiting..."
                exit 0
                ;;
            *)
                echo "❌ Invalid option. Please choose 1-7."
                echo ""
                ;;
        esac
    done
else
    # Command-line argument mode
    case $1 in
        dev)
            start_dev_single
            ;;
        dev:cluster)
            start_dev_cluster
            ;;
        prod)
            start_prod_single
            ;;
        prod:cluster)
            start_prod_cluster
            ;;
        docker:dev)
            start_docker_dev
            ;;
        docker:prod)
            start_docker_prod
            ;;
        *)
            echo "❌ Invalid option: $1"
            echo ""
            echo "Usage: ./quick-start.sh [option]"
            echo ""
            echo "Options:"
            echo "  dev           - Development single instance"
            echo "  dev:cluster   - Development cluster mode"
            echo "  prod          - Production single instance"
            echo "  prod:cluster  - Production cluster mode"
            echo "  docker:dev    - Docker development"
            echo "  docker:prod   - Docker production"
            exit 1
            ;;
    esac
fi
