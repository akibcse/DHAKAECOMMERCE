# Deploying DhakaEcommerce to Vercel

The project is configured for Vercel deployment with a `vercel.json` file that handles routing.

## Method 1: Using Vercel CLI (Recommended for quick test)

1. Open your terminal in the project folder:
   ```bash
   cd dhaka-ecommerce
   ```

2. Run the deployment command:
   ```bash
   npx vercel
   ```

3. Follow the prompts:
   - **Log in to Vercel**: It will open a browser window.
   - **Set up and deploy**:
     - `Set up and deploy "dhaka-ecommerce"?` **[y]**
     - `Which scope do you want to deploy to?` **[Select your account]**
     - `Link to existing project?` **[N]**
     - `What's your project's name?` **[dhaka-ecommerce]**
     - `In which directory is your code located?` **[./]** (Just press Enter)
     - `Want to modify these settings?` **[N]** (It auto-detects Vite)

4. Wait for the build to complete. It will give you a **Production** URL (e.g., `https://dhaka-ecommerce-xyz.vercel.app`).

## Method 2: Using GitHub (Recommended for production)

1. Push your code to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard).
3. Click **"Add New..."** -> **"Project"**.
4. Import your Git repository.
5. Vercel will auto-detect "Vite" framework settings.
6. Click **Deploy**.

## ⚠️ Important Config Note

I have already created a `vercel.json` file in your project root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This is **Crucial** for React apps. Without it, refreshing pages like `/shop` or `/cart` will result in a 404 error.
