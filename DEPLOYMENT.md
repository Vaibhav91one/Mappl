# 🚀 Mappl Deployment Guide

This guide covers deploying Mappl to Appwrite Sites and troubleshooting common issues.

## 📋 Prerequisites

- Appwrite project with all required collections and storage bucket
- Environment variables configured
- Appwrite CLI installed (`npm install -g appwrite-cli`)

## 🔧 Appwrite Sites Deployment

### 1. Configure Appwrite Project

Ensure your Appwrite project has:
- **Database**: `events`, `users`, `messages` collections
- **Storage**: Bucket for event images
- **Authentication**: Google and GitHub OAuth providers
- **Permissions**: Proper read/write permissions for all collections

### 2. Set Environment Variables

Create a `.env.local` file with your Appwrite configuration:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_API_KEY=your_api_key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=your_events_collection_id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your_users_collection_id
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=your_messages_collection_id
NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_storage_bucket_id
NEXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID=your_admin_team_id
GOOGLE_SITE_VERIFICATION=your_google_verification_code
```

### 3. Deploy to Appwrite Sites

#### Option A: Using Appwrite CLI

```bash
# Login to Appwrite
appwrite login

# Deploy to Sites
appwrite deploy site

# Or deploy with specific configuration
appwrite deploy site --project=your_project_id
```

#### Option B: Using Appwrite Console

1. Go to your Appwrite Console
2. Navigate to **Functions** → **Sites**
3. Click **Create Site**
4. Upload your built application (`.next` folder)
5. Configure environment variables
6. Deploy

### 4. Configure Custom Domain (Optional)

1. In Appwrite Console, go to your site settings
2. Add your custom domain
3. Update DNS records as instructed
4. Enable SSL certificate

## 🔍 Troubleshooting Common Issues

### 404 Page Not Found

**Symptoms**: Getting 404 errors when accessing routes

**Solutions**:
1. **Check Next.js Configuration**: Ensure `next.config.js` has proper settings
2. **Verify Routing**: Check that all pages exist in the correct directory structure
3. **Check Build Output**: Ensure build completed successfully
4. **Environment Variables**: Verify all required environment variables are set

### Build Errors

**Symptoms**: Build fails during deployment

**Solutions**:
1. **Fix TypeScript Errors**: Run `npm run build` locally to identify issues
2. **Check Dependencies**: Ensure all dependencies are properly installed
3. **Environment Variables**: Make sure all required variables are available during build
4. **Client/Server Components**: Ensure proper usage of "use client" directive

### Authentication Issues

**Symptoms**: OAuth login not working

**Solutions**:
1. **OAuth Configuration**: Verify OAuth providers are properly configured in Appwrite
2. **Redirect URLs**: Ensure callback URLs are correctly set
3. **Environment Variables**: Check that all Appwrite configuration is correct

### API Route Errors

**Symptoms**: API endpoints returning errors

**Solutions**:
1. **Environment Variables**: Ensure all required variables are set
2. **Permissions**: Check Appwrite collection permissions
3. **API Key**: Verify API key has proper permissions
4. **CORS**: Check if CORS is properly configured

## 📁 Project Structure for Deployment

```
mappl/
├── .next/                    # Build output (deploy this)
├── public/                   # Static assets
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   └── lib/                 # Utility functions
├── next.config.js           # Next.js configuration
├── _appwrite.json          # Appwrite Sites configuration
├── package.json            # Dependencies
└── .env.local              # Environment variables (don't deploy)
```

## 🚀 Deployment Checklist

- [ ] All environment variables configured
- [ ] Build completes successfully (`npm run build`)
- [ ] All pages accessible locally
- [ ] OAuth providers configured in Appwrite
- [ ] Database collections created with proper permissions
- [ ] Storage bucket configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate enabled

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Appwrite Sites

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to Appwrite Sites
        run: |
          npm install -g appwrite-cli
          appwrite login --key ${{ secrets.APPWRITE_API_KEY }}
          appwrite deploy site
```

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the [Appwrite Documentation](https://appwrite.io/docs)
2. Review the [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
3. Open an issue on the project repository
4. Contact the development team

---

**Happy Deploying! 🎉**
