# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to resolve import" or "Cannot find module" Errors

**Error Example:**
```
[plugin:vite:import-analysis] Failed to resolve import "@aws-sdk/client-s3" from "src/cloudflareStorage.js"
```

**Cause:** Dependencies are not installed or are out of date.

**Solution:**
```bash
# Install all dependencies
npm install

# Or with pnpm (if you're using pnpm)
pnpm install
```

After installing, restart your dev server:
```bash
npm run dev
```

---

### 2. ERR_NAME_NOT_RESOLVED for Images

**Error Example:**
```
GET https://flowfitpro.it/clients/.../photo.jpg net::ERR_NAME_NOT_RESOLVED
```

**Cause:** R2 bucket is not configured for public access, or invalid custom domain.

**Solution:** See [R2-PUBLIC-ACCESS-SETUP.md](./R2-PUBLIC-ACCESS-SETUP.md)

Quick fix:
1. Enable public access on R2 bucket
2. Ensure `VITE_R2_PUBLIC_URL` is empty in `.env`
3. Rebuild: `npm run build`

---

### 3. CORS Errors When Uploading

**Error Example:**
```
Access to fetch at 'https://fitflow...r2.cloudflarestorage.com/...' has been blocked by CORS policy
```

**Cause:** CORS policy not configured on R2 bucket.

**Solution:** See [R2-CORS-SETUP.md](./R2-CORS-SETUP.md)

Quick fix:
1. Go to Cloudflare Dashboard → R2 → bucket → Settings → CORS Policy
2. Copy contents from `cors.json`
3. Paste and save

---

### 4. Images Not Loading After Upload

**Symptoms:**
- Upload succeeds
- Image shows broken/missing
- Console shows 403 or 404 errors

**Cause:** R2 bucket not public.

**Solution:**
1. Dashboard → R2 → bucket `fitflow` → Settings → Public Access
2. Enable "Allow Access via R2.dev subdomain"
3. Save

---

### 5. Build Fails with Environment Variable Errors

**Error Example:**
```
ReferenceError: process is not defined
```

**Cause:** Missing environment variables or incorrect configuration.

**Solution:**

1. **For local development:**
   - Copy `.env.example` to `.env`
   - Fill in all required variables (Firebase + R2)

2. **For production (GitHub Actions):**
   - Go to: https://github.com/MentalFitApp/PtPro/settings/secrets/actions
   - Add all required secrets (see [AZIONE-RICHIESTA.md](./AZIONE-RICHIESTA.md))

---

### 6. Changes Not Reflected After Pull

**Symptoms:**
- Pulled latest changes
- But app still shows old behavior
- Or getting import errors

**Solution:**

```bash
# 1. Pull latest changes
git pull

# 2. Install/update dependencies
npm install

# 3. Clear any cached builds
rm -rf dist node_modules/.vite

# 4. Rebuild
npm run build

# 5. Restart dev server
npm run dev
```

---

### 7. Port Already in Use

**Error Example:**
```
Port 5173 is already in use
```

**Solution:**

**Option 1:** Kill the process using the port:
```bash
# Find the process
lsof -ti:5173

# Kill it
kill -9 $(lsof -ti:5173)
```

**Option 2:** Use a different port:
```bash
npm run dev -- --port 5174
```

---

### 8. Firebase Permission Denied

**Error Example:**
```
FirebaseError: Missing or insufficient permissions
```

**Cause:** Firestore rules or missing authentication.

**Solution:**
1. Check you're logged in
2. Verify Firestore rules in `firestore.rules`
3. Make sure your user has the correct role (admin, collaboratore, etc.)

---

## General Debugging Steps

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Check Node Version**
   ```bash
   node --version  # Should be 18.x or higher
   ```

3. **Clear Cache**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check Git Status**
   ```bash
   git status
   git log --oneline -5
   ```

5. **Verify Environment Variables**
   ```bash
   # Check if .env exists
   ls -la .env
   
   # Show variables (without values)
   grep "^VITE_" .env | cut -d= -f1
   ```

---

## Need More Help?

1. Check documentation:
   - [README.md](./README.md) - Getting started
   - [AZIONE-RICHIESTA.md](./AZIONE-RICHIESTA.md) - R2 setup (Italian)
   - [R2-PUBLIC-ACCESS-SETUP.md](./R2-PUBLIC-ACCESS-SETUP.md) - Public access
   - [R2-CORS-SETUP.md](./R2-CORS-SETUP.md) - CORS configuration
   - [CHANGELOG-R2-FIX.md](./CHANGELOG-R2-FIX.md) - Recent changes

2. Check the issue tracker on GitHub

3. Make sure you're on the correct branch:
   ```bash
   git branch
   ```

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Deploy to GitHub Pages
npm run deploy
```
