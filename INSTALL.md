# Installation & Setup Guide

A complete guide to getting Dragon's Hoard running on your system.

## Table of Contents
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Running the Game](#running-the-game)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: macOS 10.13+, Windows 10+, Ubuntu 18.04+
- **Node.js**: 16.0.0 or higher
- **npm**: 7.0.0 or higher
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Disk Space**: ~500MB for node_modules + dev tools

### Recommended Setup
- **Node.js**: 18+ (LTS)
- **npm**: 9+
- **Editor**: VS Code with TypeScript and Tailwind CSS extensions
- **Browser DevTools**: Enabled for debugging

### Verify Your Environment

```bash
# Check Node.js version
node --version
# Should output: v16.0.0 or higher

# Check npm version
npm --version
# Should output: 7.0.0 or higher
```

---

## Installation

### Step 1: Clone the Repository

Using Git:
```bash
git clone https://github.com/sp80808/DragonsHoard.git
cd DragonsHoard
```

Or download as ZIP:
1. Visit https://github.com/sp80808/DragonsHoard
2. Click "Code" → "Download ZIP"
3. Extract and navigate to folder

### Step 2: Install Dependencies

```bash
npm install
```

This will:
- Download all required packages from npm registry
- Install React, TypeScript, Vite, and dependencies
- Create `node_modules/` directory (~400MB)
- Generate `package-lock.json` for reproducible installs

**Expected output**:
```
added 156 packages in 12s
```

**Troubleshooting**:
- If installation fails, try `npm cache clean --force` then retry
- On Windows, you may need to run as Administrator
- Proxy issues? Configure with `npm config set proxy [proxy-url]`

### Step 3: Verify Installation

```bash
npm run dev
```

You should see:
```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open http://localhost:5173 in your browser. The game should load.

---

## Running the Game

### Development Mode

```bash
npm run dev
```

**Features**:
- Hot reload on file changes
- Console shows TypeScript errors
- Source maps for debugging
- No build step (instant feedback)

**Port**: Default is `5173`. If occupied, Vite will use next available port.

**Stop Server**: Press `Ctrl+C` in terminal

### Using Your Game

1. **Starting**: Click "New Game" on splash screen
2. **Playing**: 
   - Arrow keys (desktop) or swipe (mobile) to move
   - Click buttons for shop, settings, etc.
3. **Saving**: Game saves automatically after each move
4. **Resuming**: Click "Continue" to load saved game

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` | Move up |
| `↓` | Move down |
| `←` | Move left |
| `→` | Move right |
| `R` | Restart game |
| `S` | Open store |
| `P` | Toggle settings |

---

## Building for Production

### Create Production Build

```bash
npm run build
```

**Output**:
- Creates `dist/` directory
- Minified JavaScript (~150KB gzipped)
- Optimized assets
- Tree-shaken dependencies

**Verification**:
```bash
npm run preview
```

Opens production build at http://localhost:4173 for testing.

### Build Output Structure

```
dist/
├── index.html          # Main HTML file
├── assets/
│   ├── index-ABC123.js # Bundled & minified code
│   └── index-ABC123.css # Minified styles
└── manifest.json       # PWA manifest (future)
```

---

## Deployment

### Deploy to Vercel (Recommended)

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
vercel
```

Follow prompts to connect GitHub repo and deploy.

**Option B: GitHub Integration**

1. Push to GitHub repo
2. Connect repo to Vercel at https://vercel.com
3. Vercel auto-deploys on every push

### Deploy to GitHub Pages

```bash
# Add to package.json
"deploy": "gh-pages -d dist"

# Install deployment tool
npm install --save-dev gh-pages

# Deploy
npm run build
npm run deploy
```

### Deploy to Netlify

**Via CLI**:
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Via Web UI**:
1. Drag `dist/` folder to https://app.netlify.com/drop
2. Or connect GitHub repo for auto-deployment

### Deploy to Custom Server

**SSH/FTP**:
```bash
# Build locally
npm run build

# Upload dist/ folder to your server
scp -r dist/ user@server:/var/www/dragons-hoard/
```

**Docker**:
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["npx", "serve", "dist"]
```

```bash
docker build -t dragons-hoard .
docker run -p 3000:3000 dragons-hoard
```

---

## Troubleshooting

### Installation Issues

**Error: `npm ERR! code ERESOLVE`**
```bash
# Use legacy peer deps resolver (Node 16)
npm install --legacy-peer-deps

# Or upgrade Node.js
node --version  # Should be 18+
```

**Error: `command not found: npm`**
- Node.js not installed correctly
- Reinstall from https://nodejs.org
- Restart terminal after installation

**Error: `EACCES: permission denied`**
```bash
# On macOS/Linux, try:
sudo npm install -g npm

# Or use Node version manager (nvm):
curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Runtime Issues

**Game won't load**
1. Check browser console (`F12`)
2. Verify no errors in Dev Tools
3. Clear browser cache: `Ctrl+Shift+Delete`
4. Try different browser

**Blank page**
- Check network tab in Dev Tools
- Verify port 5173 isn't blocked
- Try: `npm run dev -- --host 0.0.0.0`

**Tiles not rendering**
- Check if images loading (Network tab)
- Pollinations.ai might be slow or down
- Try fallback in browser console:
  ```javascript
  localStorage.removeItem('dragon_hoard_game');
  location.reload();
  ```

**Save not persisting**
- Check localStorage is enabled in browser
- Try private/incognito mode
- Check storage quota (unlikely on desktop)

### Build Issues

**Error: `build failed`**
```bash
# Check TypeScript errors
npm run build 2>&1 | head -50

# Check for missing files
ls -la src/  # Should see App.tsx, etc.
```

**Error: `ENOSPC: no space left on device`**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Slow build**
- Close other apps to free RAM
- Use SSD (faster than HDD)
- Update Node.js and npm to latest

### Development Server Issues

**Port 5173 already in use**
```bash
# Use different port
npm run dev -- --port 3000

# Or kill existing process
lsof -i :5173
kill -9 <PID>
```

**Hot reload not working**
- Check file is being saved correctly
- Restart dev server: `Ctrl+C` then `npm run dev`
- Check no CSS or TypeScript syntax errors

**Slow dev server**
- Reduce file watcher scope
- Disable browser extensions
- Check disk space available

### Performance Issues

**Game is slow/laggy**
1. Check browser console for errors
2. Open DevTools → Performance tab
3. Record game action and analyze frame time
4. Check if running on slow connection (Pollinations.ai image loading)

**High memory usage**
```bash
# Monitor with System Monitor or Task Manager
# If using Node 18+, memory should be stable
# If not, restart dev server
```

### Getting Help

1. **Check existing issues**: https://github.com/sp80808/DragonsHoard/issues
2. **Review documentation**: Start with README.md
3. **Search Stack Overflow**: React/Vite/TypeScript tags
4. **Create detailed issue**:
   - OS and Node.js version
   - Full error message and stack trace
   - Steps to reproduce
   - Screenshots if UI-related

---

## Next Steps

After successful installation:

1. **Play the Game**: Understand mechanics and progression
2. **Read Game Design**: See `GAME_DESIGN.md` for mechanics
3. **Review Architecture**: Check `ARCHITECTURE.md` for code structure
4. **Start Contributing**: See `CONTRIBUTING.md` for guidelines

---

## System Information Script

Capture your environment for bug reports:

```bash
# Create environment report
cat > ENVIRONMENT.txt << EOF
$(uname -a)
Node: $(node --version)
npm: $(npm --version)
Browser: $(npx detect-browser)
Disk Space: $(df -h . | tail -1)
EOF

# Share in issue: `cat ENVIRONMENT.txt`
```

---

## Frequently Asked Questions

**Q: Do I need an API key to play?**
A: No! The game works entirely offline. AI-generated images are cached, so images load once then reuse.

**Q: Can I play on mobile?**
A: Yes! The game is responsive and works on tablets and smartphones.

**Q: How do I reset my game?**
A: Clear your browser's localStorage:
```javascript
// In browser console (F12)
localStorage.clear();
location.reload();
```

**Q: How do I backup my save?**
A: Export from localStorage:
```javascript
// In browser console
JSON.stringify(localStorage);
// Copy output and save to file
```

**Q: Can I play offline?**
A: Yes (sort of). Game logic works offline, but creature images require initial load.

---

## Performance Optimization Tips

For best experience:

1. **Modern Browser**: Use latest Chrome/Firefox/Safari
2. **Hardware**: 4GB+ RAM, SSD recommended
3. **Connection**: Broadband for image loading (AI-generated)
4. **Browser Cache**: Enable to store creature images
5. **Extensions**: Disable ad-blockers (they may block images)

---

## Support

- 📧 **Email**: (Contact through GitHub)
- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions
- 🎮 **Chat**: Community Discord (future)

---

**Happy adventuring! 🐉**
