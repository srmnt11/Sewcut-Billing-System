# DEPLOYMENT GUIDE - Sewcut Billing System

This guide will walk you through deploying your Sewcut Billing System to Vercel (frontend) and Railway (backend).

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Railway Account** - Sign up at [railway.app](https://railway.app)
4. **MongoDB Atlas Account** - Sign up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) for a free cloud database

---

## 🚀 Part 1: Deploy Backend to Railway

### Step 1: Create a MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier is fine)
3. Create a database user (remember username and password)
4. Whitelist all IP addresses (0.0.0.0/0) for Railway access
5. Get your connection string - it will look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/sewcut-billing?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your **Sewcut Billing System** repository
6. Railway will automatically detect your Node.js app

### Step 3: Configure Environment Variables on Railway

1. In your Railway project, go to **"Variables"** tab
2. Add the following environment variables:

```
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sewcut-billing?retryWrites=true&w=majority
DB_NAME=sewcut-billing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=*
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM_NAME=Sewcut Company
```

**Important Notes:**
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Generate a strong random string for `JWT_SECRET` (you can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- For Gmail SMTP, you need to create an [App Password](https://support.google.com/accounts/answer/185833)
- We'll update `CORS_ORIGIN` after deploying the frontend

### Step 4: Get Your Railway Backend URL

1. After deployment completes, Railway will provide you with a public URL
2. It will look like: `https://your-app-name.up.railway.app`
3. **Copy this URL** - you'll need it for Vercel

### Step 5: Update CORS_ORIGIN

1. Go back to Railway Variables
2. Update `CORS_ORIGIN` to your future Vercel domain (we'll set this after frontend deployment)

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your **Sewcut Billing System** repository from GitHub
4. Vercel will auto-detect it's a Vite project

### Step 2: Configure Build Settings

Vercel should auto-detect these settings, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variable

1. In the **"Environment Variables"** section, add:
   ```
   VITE_API_URL=https://your-railway-app.up.railway.app/api
   ```
   Replace `your-railway-app.up.railway.app` with your actual Railway URL from Part 1, Step 4

2. Click **"Deploy"**

### Step 4: Get Your Vercel URL

1. After deployment completes, Vercel will provide you with a URL
2. It will look like: `https://your-app-name.vercel.app`
3. **Copy this URL**

### Step 5: Update Railway CORS_ORIGIN

1. Go back to **Railway** → Your Project → **Variables**
2. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN=https://your-app-name.vercel.app
   ```
3. Railway will automatically redeploy with the new setting

---

## ✅ Verification

### Test Your Deployment

1. **Open your Vercel URL** in a browser
2. **Test the following flows:**
   - Register a new user
   - Login
   - Create a billing
   - View analytics/reports
   - Check drafts

### Check Backend Health

Visit: `https://your-railway-app.up.railway.app/health`

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-16T..."
}
```

---

## 🔧 Troubleshooting

### Frontend can't connect to backend
- Check that `VITE_API_URL` on Vercel matches your Railway URL
- Check that `CORS_ORIGIN` on Railway matches your Vercel URL
- Ensure both URLs include `https://` and NO trailing slash

### Backend database errors
- Verify MongoDB Atlas connection string is correct
- Check that IP whitelist includes 0.0.0.0/0
- Verify database user credentials

### Email not working
- Ensure SMTP credentials are correct
- For Gmail, use an App Password, not your regular password
- Check that SMTP_PORT is 587 and SMTP_SECURE is false

### Railway deployment fails
- Check Railway build logs for errors
- Verify all required environment variables are set
- Ensure `package.json` has the `start` script

---

## 🔄 Continuous Deployment

Both Vercel and Railway are now set up for automatic deployments:
- **Push to GitHub** → Vercel & Railway automatically deploy
- **Pull Requests** → Vercel creates preview deployments

---

## 📊 Monitoring

### Railway Dashboard
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history

### Vercel Dashboard
- View deployment logs
- Monitor analytics
- Check build times

---

## 🔐 Security Checklist

- ✅ JWT_SECRET is a strong random string
- ✅ MongoDB connection string uses a strong password
- ✅ CORS_ORIGIN is set to your specific Vercel domain (not *)
- ✅ Email credentials use app-specific passwords
- ✅ All sensitive data is in environment variables, not code

---

## 💡 Tips

1. **Custom Domain**: Both Vercel and Railway support custom domains
2. **Environment Variables**: Can be updated anytime without code changes
3. **Rollbacks**: Both platforms support instant rollbacks to previous deployments
4. **Logs**: Always check logs first when troubleshooting

---

## 📞 Need Help?

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas Docs: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**🎉 Congratulations! Your Sewcut Billing System is now live!**
