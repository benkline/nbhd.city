# Static Deployment Guide - Homepage

The homepage is configured as a **static site** that can be deployed to S3, Cloudflare Pages, Vercel, or any static hosting provider.

## What Makes It Static?

- ✅ **Client-side routing** - Hash-based routes (#/login, #/dashboard)
- ✅ **No server required** - Pure HTML/CSS/JavaScript
- ✅ **Serverless auth** - Token-based auth via API
- ✅ **Fast deployment** - Just upload static files to S3
- ✅ **Cost-effective** - Minimal AWS costs (~$1-5/month)

## How It Works

### Routing Strategy
The homepage uses **hash-based routing** with `HashRouter`:
- Routes work via URL hash: `http://example.com/#/login`
- No server-side routing needed
- Works with any static host (S3, GitHub Pages, etc.)

### OAuth Callback Handling
1. User clicks "Login with BlueSky"
2. Redirected to API's `/auth/login` endpoint
3. API performs OAuth with BlueSky
4. API redirects to `https://your-domain.com/callback?token=JWT_TOKEN`
5. `callback.html` (static page) captures the token
6. Redirect to `/#/auth/success?token=...`
7. AuthSuccess component processes login
8. User is redirected to dashboard

## Building

### Development
```bash
npm install
npm run dev  # Runs on http://localhost:5173
```

### Production Build
```bash
npm run build
```

This creates a `dist/` folder with:
- `index.html` - Main app file
- `callback.html` - OAuth callback handler
- `assets/` - JavaScript, CSS, images (with hash-based names)

All files are static and ready for deployment.

### Output Structure
```
dist/
├── index.html          # Main app
├── callback.html       # OAuth callback handler
└── assets/
    ├── index-*.js      # React app bundle
    ├── index-*.css     # Styles
    └── react.svg       # Assets
```

## Deployment to AWS S3 + CloudFront

### Prerequisites
- AWS account with S3 access
- AWS CLI configured
- Built static files (`dist/` folder)

### Step 1: Create S3 Bucket

```bash
# Create bucket (must be globally unique)
aws s3api create-bucket \
  --bucket nbhd-city-homepage-YOURID \
  --region us-east-1

# Block public access (CloudFront will handle it)
aws s3api put-public-access-block \
  --bucket nbhd-city-homepage-YOURID \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket nbhd-city-homepage-YOURID \
  --versioning-configuration Status=Enabled
```

### Step 2: Upload Files to S3

```bash
# Sync dist folder to S3
aws s3 sync dist/ s3://nbhd-city-homepage-YOURID/ \
  --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html,callback.html"

# Upload HTML files without caching
# (They may change with new deployments)
aws s3 cp dist/index.html s3://nbhd-city-homepage-YOURID/index.html \
  --cache-control "max-age=3600" \
  --content-type "text/html"

aws s3 cp dist/callback.html s3://nbhd-city-homepage-YOURID/callback.html \
  --cache-control "max-age=3600" \
  --content-type "text/html"
```

### Step 3: Create CloudFront Distribution

```bash
# Create distribution using S3 bucket
aws cloudfront create-distribution \
  --origin-domain-name nbhd-city-homepage-YOURID.s3.us-east-1.amazonaws.com \
  --default-root-object index.html \
  --error-responses ErrorCode=404,ResponseCode=200,ResponsePagePath=/index.html \
  --description "nbhd.city Homepage"
```

Or use the console:
1. Go to CloudFront in AWS Console
2. Create distribution
3. Choose S3 bucket as origin
4. Set default root object to `index.html`
5. Add error response:
   - Error Code: 404
   - Response Code: 200
   - Response Page Path: `/index.html`
6. Create distribution

### Step 4: Configure API Redirect URI

For your deployed homepage, update the API's `BLUESKY_OAUTH_REDIRECT_URI`:

**Development:**
```
http://localhost:8000/auth/callback?redirect_uri=http://localhost:5173/callback
```

**Production:**
```
https://your-cloudfront-domain.cloudfront.net/callback
```

Or use environment variable in API:
```bash
BLUESKY_OAUTH_REDIRECT_URI=https://your-cloudfront-domain.cloudfront.net/callback
```

## Deployment to Other Platforms

### GitHub Pages
```bash
# Build
npm run build

# Deploy (if repo is public)
npx gh-pages -d dist
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir dist
```

### Cloudflare Pages
```bash
# Install Wrangler
npm i -g wrangler

# Deploy
wrangler deploy --directory dist
```

## Environment Variables

Create `.env` file for deployment:

```env
# API endpoint (can be different for each deployment)
VITE_API_URL=https://api.nbhd.city
VITE_APP_NAME=nbhd.city
```

Build variables into the app during build time:
```bash
VITE_API_URL=https://api.nbhd.city npm run build
```

## Error Handling

### 404 Error Handling
For hash-based routing to work with static hosts, 404 errors should be redirected to `index.html`.

**S3 + CloudFront:**
Already configured in CloudFront distribution setup (error response).

**Other hosts:**
- Netlify: Add `_redirects` file
- Vercel: Add `vercel.json` config
- GitHub Pages: Works automatically with hash routing

### Example _redirects (Netlify)
```
/*  /index.html   200
```

## Caching Strategy

### Static Assets (JS, CSS, Images)
- Use hash-based filenames (done by Vite)
- Long cache: `max-age=31536000` (1 year)
- Immutable flag: `immutable`

### HTML Files (index.html, callback.html)
- Short cache: `max-age=3600` (1 hour)
- Can change with updates
- CloudFront should revalidate frequently

### Example Cache Headers
```
# JavaScript and CSS (hashed filenames)
Cache-Control: max-age=31536000, immutable

# HTML files
Cache-Control: max-age=3600
```

## Monitoring & Maintenance

### Check Deployment
```bash
# Test homepage loads
curl https://your-domain.com

# Test OAuth callback
curl https://your-domain.com/callback

# Check API connectivity
curl https://your-domain.com/api.js  # Will be in network requests
```

### CloudWatch Metrics
Monitor CloudFront distribution:
1. Go to CloudFront console
2. Select your distribution
3. View metrics:
   - Requests
   - Bytes downloaded
   - Cache hit ratio
   - Errors

### Logs
Enable CloudFront logs to S3:
1. Edit distribution
2. Enable standard logging
3. Specify S3 bucket
4. Analyze access patterns

## Performance Optimization

### Current Optimizations
- ✅ Vite automatic code splitting
- ✅ Gzip compression by CloudFront
- ✅ Asset hashing for cache busting
- ✅ React fast refresh in development

### Additional Optimizations
Consider for production:

1. **Image Optimization**
```bash
# Install image plugin
npm install -D vite-plugin-image-optimization

# Update vite.config.js to use it
```

2. **Preload Critical Resources**
```html
<link rel="preload" href="/assets/index-*.js" as="script">
```

3. **Service Worker**
```bash
# Install workbox
npm install -D workbox-cli

# Configure for offline support
```

## Troubleshooting

### 404 on Refresh
**Problem:** Refreshing page on `/dashboard` shows 404

**Solution:**
- ✅ Already configured! CloudFront redirects 404 to index.html
- Hash routing handles the URL client-side

### Token Not Working
**Problem:** Token valid in development but not in production

**Solution:**
- Verify `VITE_API_URL` points to correct API
- Check API CORS configuration
- Ensure API can reach your domain

### OAuth Redirect Issues
**Problem:** Stuck on login page or redirect loop

**Solution:**
- Verify BLUESKY_OAUTH_REDIRECT_URI matches your domain
- Check callback.html exists in distribution
- Verify CloudFront cache is cleared

### Images Not Loading
**Problem:** Images appear broken in production

**Solution:**
- Check asset paths are correct (usually `/assets/...`)
- Verify CloudFront is serving from correct S3 origin
- Check S3 bucket permissions

## Cost Estimation

Monthly costs for production deployment:

| Service | Cost | Notes |
|---------|------|-------|
| S3 Storage | $0.10-0.50 | ~1GB files |
| CloudFront | $0.50-5 | Depends on traffic |
| Data transfer | $0-10 | First 1GB free per month |
| **Total** | **~$5-15** | Low traffic site |

Free alternatives:
- GitHub Pages (100GB storage)
- Netlify (300GB bandwidth free)
- Vercel (unlimited bandwidth)
- Cloudflare Pages (unlimited bandwidth)

## Production Checklist

- [ ] Build test: `npm run build`
- [ ] Test locally: `npm run preview`
- [ ] S3 bucket created and configured
- [ ] CloudFront distribution created
- [ ] Error handling configured (404 → index.html)
- [ ] Cache headers configured
- [ ] API BLUESKY_OAUTH_REDIRECT_URI updated
- [ ] API CORS allows your domain
- [ ] SSL certificate configured (CloudFront handles this)
- [ ] Domain DNS points to CloudFront
- [ ] Tested OAuth flow end-to-end
- [ ] Monitoring and logs configured
- [ ] Backup/rollback plan documented

## Rollback

If something goes wrong:

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"

# Rollback to previous version
# 1. S3 versioning tracks all uploads
# 2. Select previous version in S3 console
# 3. Or restore specific files:

aws s3 cp s3://bucket/index.html.v1 s3://bucket/index.html
```

## Security

The static site:
- ✅ No secrets stored in code
- ✅ API key stored in HTTP headers (not visible in network)
- ✅ JWT tokens stored in localStorage
- ✅ HTTPS enforced via CloudFront
- ✅ Content Security Policy recommended

## Next Steps

1. **Build & Test Locally**
   ```bash
   npm run build
   npm run preview
   ```

2. **Deploy to S3**
   - Follow S3 deployment steps above
   - Or use devops/frontend.tf (OpenTofu)

3. **Configure API**
   - Update BLUESKY_OAUTH_REDIRECT_URI
   - Update CORS configuration

4. **Set Up Monitoring**
   - Enable CloudFront logs
   - Set up CloudWatch alarms

5. **Custom Domain** (Optional)
   - Create Route 53 record
   - Or update DNS at domain registrar
   - Verify SSL certificate

## Support

For issues:
- Check CloudFront error logs
- Verify S3 bucket permissions
- Test API connectivity
- Check browser console for errors
