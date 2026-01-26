# How to Fix Image Upload (CORS Error)

The "Blocked by CORS policy" error happens because your Firebase Storage bucket is not configured to accept uploads from `localhost` or your deployed domain.

Since you don't have the `gsutil` command line tool installed, you need to set this up via the Google Cloud Console.

## Step 1: Get Your Vercel Deployment URL

After deploying to Vercel, you'll get a URL like:
- `https://dhaka-ecommerce.vercel.app` or
- `https://dhaka-ecommerce-abc123.vercel.app`

Keep this URL handy - you'll need it in the next step.

## Step 2: Apply CORS Configuration

### Using Google Cloud Shell (Recommended)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Make sure you are in the project `dhakaecommerce-86c3c`.
3. Click the **Activate Cloud Shell** icon (top right, looks like a terminal `>_`).
4. In the Cloud Shell terminal, run this command (replace `YOUR_VERCEL_URL` with your actual Vercel URL):

```bash
cat > cors.json << 'EOF'
[
  {
    "origin": [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://dhakaecommerce-86c3c.web.app",
      "https://dhakaecommerce-86c3c.firebaseapp.com",
      "YOUR_VERCEL_URL"
    ],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-resumable", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://dhakaecommerce-86c3c.firebasestorage.app
```

5. The output should say: `Setting CORS on gs://dhakaecommerce-86c3c.firebasestorage.app/...`

## Step 3: Verify

After applying the CORS configuration:
- Image uploads should work on localhost
- Image uploads should work on your Vercel deployment
- No code changes needed - this is purely a Firebase Storage permission

## Alternative: Using gsutil Locally

If you have [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed locally:

1. Edit `cors.json` in your project folder and replace `REPLACE_WITH_YOUR_VERCEL_URL` with your actual Vercel URL
2. Run:
   ```powershell
   gsutil cors set cors.json gs://dhakaecommerce-86c3c.firebasestorage.app
   ```
