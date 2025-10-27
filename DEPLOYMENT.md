# Vercel Deployment Checklist

## ✅ Pre-Deployment

- [x] All files committed to Git
- [x] Production build tested successfully
- [x] Vercel configuration file created (vercel.json)
- [x] README updated with deployment instructions

## 📦 Deployment Steps

### 1. GitHub Setup
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for deployment"

# Connect to GitHub
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 2. Vercel Deployment

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration
5. Review settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
6. Click **"Deploy"**
7. Wait for deployment to complete (usually 2-3 minutes)

### 3. Post-Deployment

- Your app will be live at: `https://your-project-name.vercel.app`
- Automatic deployments on every push to main branch
- Preview deployments for pull requests

## 🔧 Configuration Files

The project includes:
- `vercel.json` - Vercel configuration
- `next.config.js` - Next.js configuration
- `.gitignore` - Git ignore file
- `package.json` - Dependencies and scripts

## 📝 Notes

- All images should be placed in `public/images/` directory
- The app is configured for Arabic (RTL) interface
- Cart state is managed client-side
- Static generation is used for optimal performance

## 🚀 Continuous Deployment

Once deployed:
- Push to `main` branch → Production deployment
- Create PR → Preview deployment
- Merged PR → Automatic production update

## 🆘 Troubleshooting

**Build fails:**
- Check Node.js version (should be 18+)
- Ensure all dependencies are in package.json
- Check for TypeScript errors

**Images not loading:**
- Verify images are in `public/images/` directory
- Check image file names match products.json
- Ensure images are committed to Git

**404 errors:**
- Clear Vercel cache
- Check routing configuration
- Verify file paths are correct
