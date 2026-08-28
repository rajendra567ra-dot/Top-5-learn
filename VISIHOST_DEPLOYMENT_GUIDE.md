# Nexus Five AI Trading Cluster - VisiHost 24/7 Deployment Guide

This full-stack application includes the real-time React 19 / Tailwind CSS UI, 5 Autonomous Specialist Trading Bots, Top 500 Coin Scanner, Risk Management Engine (5% Compounding, 3% Hard-Cap Stop Loss, $2+ Take Profit), AI Diagnostic Post-Mortems, and Telegram Webhook Dispatch.

---

## ⚡ Quick 1-Minute VPS Deployment (Recommended)

### 1. Connect to your VisiHost VPS via SSH
```bash
ssh root@YOUR_VISIHOST_IP
```

### 2. Install Node.js 20 & PM2
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential unzip
sudo npm install -g pm2
```

### 3. Extract & Setup Application
Upload your downloaded zip file to `/var/www/` and unzip:
```bash
mkdir -p /var/www/trading-fleet
cd /var/www/trading-fleet
unzip ~/nexus-five-trading-fleet.zip -d /var/www/trading-fleet

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env
```
Add your API keys inside `.env`:
```env
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### 4. Build & Launch 24/7 Engine
```bash
# Build frontend and compile backend
npm run build

# Start 24/7 background process with PM2
pm2 start ecosystem.config.cjs

# Make PM2 restart automatically if server reboots
pm2 startup
pm2 save
```

### 5. Check Live Logs & Status
```bash
pm2 status
pm2 logs nexus-five-trading-fleet
```

---

## 🌐 Nginx Reverse Proxy & Free SSL (Optional Domain Setup)

To point your domain (e.g. `trading.yourdomain.com`) to port 3000 with HTTPS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/trading-fleet`:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site & generate free SSL:
```bash
sudo ln -s /etc/nginx/sites-available/trading-fleet /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 📁 VisiHost cPanel Node.js App Setup (Alternative)

If using cPanel shared/cloud hosting with "Setup Node.js App":
1. In cPanel **File Manager**, create a folder `trading-app` and upload all files from the zip.
2. In cPanel, go to **Setup Node.js App** -> **Create Application**.
3. Set:
   - **Node.js Version**: 20.x LTS
   - **Application Mode**: Production
   - **Application Root**: `trading-app`
   - **Application Startup File**: `dist/server.cjs`
4. Under **Environment Variables**, add `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
5. Run `npm install` and `npm run build` in the cPanel terminal.
6. Click **Restart Application**.
