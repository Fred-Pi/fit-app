# Deployment Guide

## Web Deployment (Vercel)

This app is configured to deploy to Vercel as a web application.

### Prerequisites

- GitHub repository connected to Vercel
- Vercel account (free tier works)

### Automatic Deployment

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Vercel will automatically:**
   - Detect the `vercel.json` configuration
   - Run `npx expo export -p web`
   - Deploy the `dist/` folder
   - Provide you with a live URL

### Manual Deployment

If you want to deploy manually:

```bash
# Install Vercel CLI
npm install -g vercel

# Build for web
npm run build:web

# Deploy
vercel --prod
```

### Local Testing

Test the web build locally before deploying:

```bash
# Start web dev server
npm run web

# Or build and serve
npm run build:web
npx serve dist
```

### Configuration Files

- **vercel.json**: Vercel deployment configuration
- **app.json**: Expo web settings (bundler, output, theme)
- **package.json**: Build scripts

### Important Notes

⚠️ **Web Limitations:**
- Some React Native features may not work on web (device sensors, gestures may behave differently)
- AsyncStorage works on web via localStorage
- Navigation works but may need testing
- Test thoroughly on web before deploying

✅ **What Works on Web:**
- All UI components
- Navigation (React Navigation)
- Local storage (AsyncStorage → localStorage)
- Forms and modals
- Dark theme
- Responsive layouts

### Troubleshooting

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build:web
```

**Blank page on deployment:**
- Check browser console for errors
- Verify `dist/index.html` exists
- Check Vercel build logs

**404 on routes:**
- The `vercel.json` rewrites configuration handles this
- All routes redirect to `/index.html` for client-side routing

### Custom Domain

To add a custom domain in Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your domain
4. Follow DNS configuration instructions

### Environment Variables

If you need environment variables:
1. Add them in Vercel dashboard
2. Access via `process.env.EXPO_PUBLIC_*`

Example:
```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL;
```

### Performance

The web build is optimized with:
- Static asset caching (1 year)
- Code splitting
- Lazy loading
- Minification

### Monitoring

Monitor your deployment:
- Vercel Analytics (free)
- Error tracking via Vercel logs
- Performance metrics in Vercel dashboard
