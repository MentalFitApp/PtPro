# Cloudflare R2 CORS Configuration

## Issue
When uploading files to R2 from the browser, you may encounter CORS errors like:
```
Access to fetch at 'https://fitflow.7682069cf34302dfc6988fbe193f2ba6.r2.cloudflarestorage.com/...' 
from origin 'https://mentalfitapp.github.io' has been blocked by CORS policy
```

## Solution

You need to configure CORS policy on your R2 bucket to allow requests from your application's origin.

### Steps to Configure CORS on R2:

1. **Go to Cloudflare Dashboard**
   - Navigate to https://dash.cloudflare.com/
   - Go to R2 Object Storage

2. **Open Your Bucket**
   - Click on your bucket name (e.g., `fitflow`)

3. **Configure CORS Policy**
   - Go to **Settings** tab
   - Find **CORS Policy** section
   - Click **Edit CORS Policy**

4. **Paste the CORS Configuration**
   - Copy the contents from `cors.json` in this repository
   - Paste it into the CORS Policy editor
   - Click **Save**

### CORS Configuration (cors.json)

The `cors.json` file in this repository contains the correct CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://mentalfitapp.github.io"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### Important Notes:

- **AllowedOrigins**: Must include all origins where your app is hosted (development and production)
- **AllowedMethods**: Must include PUT for uploads and GET for downloads
- **AllowedHeaders**: Using "*" allows all headers (simpler for development)
- **ExposeHeaders**: Required headers that the browser can access
- **MaxAgeSeconds**: How long the browser caches the CORS preflight response

### Verification

After applying the CORS configuration:

1. Clear your browser cache
2. Try uploading a photo again
3. Check browser console - CORS errors should be gone

### Troubleshooting

If you still see CORS errors:

1. **Verify the origin is correct**: Check that your deployment URL matches exactly
2. **Check for typos**: Even a trailing slash can cause issues
3. **Wait a few minutes**: CORS changes may take time to propagate
4. **Hard refresh**: Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to clear cache

### Additional Configuration

If you're using a custom domain for R2:

1. Add your custom domain to `AllowedOrigins` in `cors.json`
2. Make sure your custom domain is properly configured in R2 settings
3. Update `VITE_R2_PUBLIC_URL` in `.env` to use your custom domain

## Testing

To test CORS is working:

1. Open browser console
2. Navigate to a page that uploads photos (e.g., Client Checks)
3. Try uploading a photo
4. You should see successful upload logs without CORS errors
