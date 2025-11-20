# 📝 Changelog - R2 Storage Fix

## Commit History

### 1️⃣ Initial CORS Fix (commit: `ef3611e`)
**Issue:** CORS errors when uploading to R2

**Changes:**
- ✅ Fixed `cors.json` format (Firebase → AWS S3 format)
- ✅ Removed 6 obsolete documentation files
- ✅ Updated GitHub workflow with R2 env vars
- ✅ Created `R2-CORS-SETUP.md`

**Result:** Upload to R2 now works ✅

---

### 2️⃣ Documentation Update (commit: `9841a8a`)
**Changes:**
- ✅ Created `AZIONE-RICHIESTA.md` (Italian step-by-step guide)
- ✅ Updated `README.md` with documentation links

---

### 3️⃣ Public URL + Image Modal Fix (commit: `326e308`) 🆕
**Issue:** Images not loading (`ERR_NAME_NOT_RESOLVED`) + opening in new tab

**Root Cause:**
- `VITE_R2_PUBLIC_URL=https://flowfitpro.it` was set but domain not configured
- Images using `<a target="_blank">` instead of modal

**Changes:**
- ✅ Removed invalid `flowfitpro.it` from `.env`
- ✅ Now uses R2 default URL: `pub-ACCOUNT_ID.r2.dev`
- ✅ Added `ImageModal` component to `ClientChecks.jsx`
  - Images open in popup overlay
  - Smooth animations with Framer Motion
  - Click outside or X to close
- ✅ Created `R2-PUBLIC-ACCESS-SETUP.md`
- ✅ Updated `AZIONE-RICHIESTA.md` with public access steps

**Result:** 
- ✅ Images will load (after enabling public access)
- ✅ Images open in popup, not new tab

---

## What User Needs to Do

### ✅ Already Done by You:
1. Applied CORS configuration to R2 bucket
2. Upload now works

### ⚠️ Still To Do:
1. **Enable Public Access on R2 bucket:**
   - Dashboard → R2 → `fitflow` → Settings → Public Access
   - "Allow Access via R2.dev subdomain"
   - Save

2. **Rebuild and deploy the app:**
   - The `.env` change needs to be built into the app
   - GitHub Action will do this automatically on next commit to main
   - Or run locally: `npm run build`

3. **Update GitHub Secret (optional but recommended):**
   - Go to: https://github.com/MentalFitApp/PtPro/settings/secrets/actions
   - Find `VITE_R2_PUBLIC_URL` secret
   - Set it to empty value (or delete it)

---

## Technical Summary

### Before Fix:
```javascript
// .env
VITE_R2_PUBLIC_URL=https://flowfitpro.it  ❌ Domain not configured

// ClientChecks.jsx
<a href={photoURL} target="_blank">  ❌ Opens in new tab
  <img src={photoURL} />
</a>
```

### After Fix:
```javascript
// .env
VITE_R2_PUBLIC_URL=  ✅ Empty = uses R2 default

// ClientChecks.jsx
<button onClick={() => setModalImage(photoURL)}>  ✅ Opens in popup
  <img src={photoURL} />
</button>

<ImageModal isOpen={!!modalImage} imageUrl={modalImage} />
```

### URL Format:
- **Upload endpoint:** `fitflow.7682069cf34302dfc6988fbe193f2ba6.r2.cloudflarestorage.com`
- **Public URL:** `pub-7682069cf34302dfc6988fbe193f2ba6.r2.dev`

---

## Testing Checklist

After enabling public access:

- [ ] Clear browser cache
- [ ] Upload a new photo in Client Checks
- [ ] Verify image displays in the app (not broken)
- [ ] Click image → opens in popup modal
- [ ] Click outside modal → closes
- [ ] Click X button → closes
- [ ] No `ERR_NAME_NOT_RESOLVED` in console
- [ ] No CORS errors in console

---

## Files Changed in This PR

| File | Status | Description |
|------|--------|-------------|
| `cors.json` | Modified | AWS S3 format for R2 |
| `.env` | Modified | Removed invalid public URL |
| `src/pages/ClientChecks.jsx` | Modified | Added ImageModal component |
| `.github/workflows/deploy.yml` | Modified | Added R2 env vars |
| `README.md` | Modified | Updated documentation links |
| `R2-CORS-SETUP.md` | Created | CORS configuration guide |
| `R2-PUBLIC-ACCESS-SETUP.md` | Created | Public access setup guide |
| `AZIONE-RICHIESTA.md` | Created | Italian step-by-step guide |
| `CHANGELOG-R2-FIX.md` | Created | This file |
| 6 obsolete .md files | Deleted | Cleanup |

---

## Next Steps

1. ✅ **You:** Enable public access on R2 (5 minutes)
2. ✅ **System:** Auto-deploy will pick up changes on next push to main
3. ✅ **Test:** Verify images load and modal works

**Need help?** Check `AZIONE-RICHIESTA.md` or `R2-PUBLIC-ACCESS-SETUP.md`
