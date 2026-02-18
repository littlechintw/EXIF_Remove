# Deployment Guide

## Quick Deploy Options

### Option 1: GitHub Pages

1. Build the project:
```bash
npm run build
```

2. The `dist/` directory contains your production files

3. Deploy to GitHub Pages:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: Create a `gh-pages` branch with contents of `dist/`
   - Or use GitHub Actions for automatic deployment

### Option 2: Netlify

1. Connect your GitHub repository to Netlify

2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. Deploy automatically on every push

### Option 3: Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts

### Option 4: Manual Static Hosting

1. Build the project:
```bash
npm run build
```

2. Upload contents of `dist/` to any web server

3. Ensure server is configured to:
   - Serve `index.html` for all routes (SPA)
   - Serve over HTTPS for security

## Build Configuration

The production build is optimized with:
- CSS minification
- JavaScript minification and code splitting
- Asset optimization
- Source maps for debugging

### Build Output

```
dist/
├── index.html          # Entry point
├── assets/
│   ├── index-*.css    # Minified CSS (~15KB)
│   └── index-*.js     # Minified JS (~124KB)
└── vite.svg           # Favicon (if not replaced)
```

## Environment Requirements

- Node.js 20+ for building
- No backend required
- Works completely static
- No environment variables needed

## Performance

- Initial load: ~140KB gzipped
- No server calls after initial load
- Offline-capable after first visit (with service worker if added)

## SEO Considerations

Update `index.html` meta tags for better SEO:
- Title (already set)
- Description (already set)
- Open Graph tags (add if needed)
- Twitter Card tags (add if needed)

## Analytics (Optional)

To add analytics:
1. Add Google Analytics or Plausible script to `index.html`
2. Ensure privacy compliance (GDPR, etc.)
3. Note: This app is privacy-focused, so analytics should respect that

## Custom Domain

After deploying:
1. Configure DNS A/CNAME records to point to hosting provider
2. Enable HTTPS (usually automatic with modern hosts)
3. Update any hardcoded URLs if necessary

## Monitoring

Consider setting up:
- Uptime monitoring (e.g., UptimeRobot)
- Error tracking (e.g., Sentry) - optional
- Performance monitoring (e.g., Lighthouse CI)
