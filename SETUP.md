# Setup Guide - TRACKSY

Complete step-by-step guide to set up and run Tracksy.

## Prerequisites

- Node.js 18 or higher
- pnpm package manager
- MongoDB Atlas account (free tier available)
- Git (for version control)
- Text editor or IDE (VS Code recommended)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd job-application-tracker

# Install dependencies
pnpm install
```

## Step 2: Set Up MongoDB

### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project
4. Create a new cluster (free tier)
5. Wait for cluster to be ready (5-10 minutes)
6. Click "Connect" → "Connect your application"
7. Copy the connection string
8. Replace `<password>` with your database user password
9. The string should look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/job-tracker?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB

```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Connection string
mongodb://localhost:27017/job-tracker
```

## Step 3: Configure Environment Variables

1. Create `.env.local` file in project root
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your configuration:
   ```env
   # MongoDB Connection String (from Step 2)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job-tracker

   # Secret key for JWT (generate random string, min 32 chars)
   JWT_SECRET=your-super-secret-key-at-least-32-characters-long

   # Groq API Key (optional - leave empty initially)
   # Get from https://console.groq.com/keys
   GROQ_API_KEY=
   GROQ_MODEL=llama-3.3-70b-versatile

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   **To generate a secure JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Step 4: Start Development Server

```bash
# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

The browser should automatically open. If not, navigate to `http://localhost:3000`

## Step 5: Test the Application

1. **Create Account**
   - Click "Get started" on the landing page
   - Fill in name, email, and password
   - Click "Create account"

2. **Add Your First Application**
   - Click "Add Application" on the dashboard
   - Fill in job title, company, and description
   - Click "Add Application"

3. **View in Kanban Board**
   - Your application appears in the "Applied" column
   - Drag and drop to move between columns (if drag-drop is enabled)
   - Click "Edit" to modify or delete

4. **Create Resume**
   - Go to "Resume" tab
   - Click "Create Resume"
   - Paste or type your resume content
   - Click "Create Resume"

5. **Test AI Features**
   - Go to application detail page
   - Scroll to "AI Job Insights"
   - Click "Analyze Job Description" to see insights
   - Mock data is used by default

## Step 6: (Optional) Enable AI Features

To use real AI features with Groq:

1. **Get API Key**
   - Go to [console.groq.com/keys](https://console.groq.com/keys)
   - Sign in or create account
   - Navigate to API keys
   - Create new secret key
   - Copy the key

2. **Add to .env.local**
   ```env
   GROQ_API_KEY=gsk-your-actual-key-here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

3. **Restart Development Server**
   - The Express backend reads `process.env.GROQ_API_KEY`
   - No extra code changes are needed once the env vars are set

4. **Restart Development Server**
   ```bash
   # Press Ctrl+C to stop
   # Then restart
   pnpm dev
   ```

## Step 7: (Optional) Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

3. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Framework preset: Next.js (auto-selected)

4. **Set Environment Variables**
   - In Vercel dashboard, go to Settings
   - Environment Variables
   - Add:
     - `MONGODB_URI` (from MongoDB Atlas)
     - `JWT_SECRET` (same as local)
     - `GROQ_API_KEY` (optional)
     - `GROQ_MODEL` (optional)

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
- Check MONGODB_URI in .env.local is correct
- For MongoDB Atlas:
  - Verify IP address is whitelisted (allow 0.0.0.0/0 for testing)
  - Check username/password are correct
  - Ensure cluster is running
- For local MongoDB:
  - Start MongoDB service: `brew services start mongodb-community`

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Build Errors

**Error:** `Module not found` or `Cannot find module`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Restart dev server
pnpm dev
```

### API Errors When Creating Account

**Error:** `401 Unauthorized` or `Cannot POST /api/auth/signup`

**Solution:**
- Make sure dev server is running
- Check browser console for error details
- Verify API routes are in correct path (`app/api/auth/`)
- Clear browser cache and cookies

## Development Tips

### Useful Commands

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start

# View help
pnpm --help
```

### Database Inspection

Use MongoDB Compass to browse your database:

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect with your MONGODB_URI
3. Browse collections: Users, JobApplications, Resumes

### Debug API Calls

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make API calls and see requests/responses
4. Check Console tab for any JavaScript errors

### Hot Reload

The development server automatically reloads when you save files. No need to restart.

## File Structure Overview

```
tracksy/
├── app/                    # Next.js app directory
│   ├── api/               # Backend API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utility functions and services
├── types/                 # TypeScript definitions
├── public/                # Static assets
├── .env.example           # Environment variables template
├── .env.local             # Local environment (git ignored)
├── package.json           # Dependencies
├── next.config.mjs        # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## Next Steps

1. **Customize the app** - Update colors, fonts, and branding
2. **Add more features** - Consider adding notifications, filters, etc.
3. **Deploy to production** - Follow the Vercel deployment steps
4. **Share with others** - Invite friends to track their job search

## Getting Help

- Check the [README.md](./README.md) for feature documentation
- Review API endpoint documentation in README.md
- Check browser console for error messages
- Ensure all environment variables are set correctly
- Verify MongoDB connection is working

## Security Notes

- Keep JWT_SECRET private and strong
- Don't commit .env.local to version control (it's in .gitignore)
- Use HTTPS in production
- Regularly update dependencies for security patches
- Keep your Groq API key private and rotate regularly

Good luck with your job search! 🚀
