#!/usr/bin/env bash
# Quick automated startup script for VisiHost VPS
set -e

echo "🚀 Installing dependencies..."
npm install

echo "🔨 Building client and backend production bundle..."
npm run build

echo "⚡ Starting 24/7 background process via PM2..."
if command -v pm2 &> /dev/null; then
    pm2 delete nexus-five-trading-fleet 2>/dev/null || true
    pm2 start ecosystem.config.cjs
    pm2 save
    echo "✅ Application is running 24/7 with PM2!"
    echo "📊 Run 'pm2 logs nexus-five-trading-fleet' to view real-time trading telemetry."
else
    echo "⚠️ PM2 is not installed globally. Starting standalone with Node..."
    NODE_ENV=production node dist/server.cjs
fi
