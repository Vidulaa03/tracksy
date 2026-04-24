# TRACKSY

An AI-assisted job application tracking system with a modern React frontend and Express.js backend. Organize your job applications with a beautiful Kanban board, manage multiple resumes, and get AI-powered insights about job descriptions.

## Features

- **Kanban Board**: Organize job applications by status (Applied, Interviewing, Accepted, Rejected)
- **Application Management**: Create, read, update, and delete job applications
- **Resume Manager**: Create and manage multiple resume versions
- **AI Insights**: Analyze job descriptions to extract key requirements using Groq
- **Resume Suggestions**: Get recommendations to optimize your resume using Groq
- **User Authentication**: Secure signup/login with JWT tokens and bcrypt hashing
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

### Frontend
- **React 19** - Latest React with hooks and concurrent features
- **Vite** - Ultra-fast build tool and dev server
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend
- **Express.js** - Lightweight and flexible Node.js framework
- **TypeScript** - Type-safe backend development
- **MongoDB & Mongoose** - NoSQL database with schema validation
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Zod** - Runtime type validation

### Architecture
- **Monorepo Structure** - Client and server in separate folders
- **Separate Dev/Build Processes** - Optimized development workflow
- **Type Safety** - Full TypeScript support throughout

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB Atlas account (or local MongoDB)
- (Optional) Groq API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job-application-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure .env.local**
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job-tracker

   # Authentication
   JWT_SECRET=your-super-secret-key-min-32-chars

   # Server
   PORT=3000
   NODE_ENV=development

   # Groq (optional)
   GROQ_API_KEY=gsk-your-api-key
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   This starts both:
   - Frontend on `http://localhost:5173`
   - Backend on `http://localhost:3000`

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
root/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # Basic UI components (Button, Input, Card)
│   │   │   ├── Header.tsx      # Navigation header
│   │   │   ├── KanbanBoard.tsx # Job application board
│   │   │   ├── AddApplicationDialog.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── SignupPage.tsx
│   │   │   └── dashboard/
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── ApplicationDetailPage.tsx
│   │   │       ├── ApplicationsListPage.tsx
│   │   │       └── ResumePage.tsx
│   │   ├── services/           # API integration
│   │   │   └── api.ts          # Axios instance and API calls
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.tsx # Authentication state
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces
│   │   ├── App.tsx             # Main app with routes
│   │   ├── main.tsx            # React entry point
│   │   └── globals.css         # Global styles and Tailwind config
│   ├── index.html              # HTML template
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── server/                      # Express.js Backend
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── auth.routes.ts
│   │   │   ├── application.routes.ts
│   │   │   ├── resume.routes.ts
│   │   │   └── ai.routes.ts
│   │   ├── models/             # MongoDB Mongoose models
│   │   │   ├── User.ts
│   │   │   ├── JobApplication.ts
│   │   │   └── Resume.ts
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                # Root monorepo config
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Development Workflow

### Running the Full Stack
```bash
# Terminal 1: Start both client and server
npm run dev

# Or run separately:
# Terminal 1
npm run dev:client

# Terminal 2
npm run dev:server
```

### Building for Production
```bash
npm run build       # Build both client and server
npm run start       # Start production server
```

### Client-only Development
```bash
cd client
npm run dev    # Vite dev server on port 5173
npm run build  # Production build
npm run lint   # ESLint check
```

### Server-only Development
```bash
cd server
npm run dev         # Hot reload with tsx watch
npm run build       # Compile TypeScript to dist/
npm run type-check  # Check types without building
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
  ```json
  { "email": "user@example.com", "name": "John Doe", "password": "password123" }
  ```
- `POST /auth/login` - Login user
  ```json
  { "email": "user@example.com", "password": "password123" }
  ```
- `GET /auth/verify` - Verify JWT token (requires Authorization header)

### Job Applications
- `GET /applications` - Get all user applications
- `POST /applications` - Create new application
  ```json
  {
    "companyName": "Google",
    "position": "Senior Engineer",
    "description": "Job description...",
    "notes": "Optional notes"
  }
  ```
- `GET /applications/:id` - Get specific application
- `PUT /applications/:id` - Update application
- `DELETE /applications/:id` - Delete application

### Resumes
- `GET /resumes` - Get all user resumes
- `POST /resumes` - Create new resume
  ```json
  { "title": "Senior Engineer Resume", "content": "Resume content..." }
  ```
- `GET /resumes/:id` - Get specific resume
- `PUT /resumes/:id` - Update resume
- `DELETE /resumes/:id` - Delete resume

### AI Features (Mock data by default)
- `POST /ai/parse-job` - Analyze job description
  ```json
  { "jobDescription": "Job posting text..." }
  ```
- `POST /ai/resume-suggestions` - Get resume tailoring suggestions
  ```json
  { "resumeContent": "...", "jobDescription": "..." }
  ```

## Database Setup

### MongoDB Atlas (Recommended for Cloud)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a free account and MongoDB cluster
3. Create a database user with a strong password
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/job-tracker`
5. Add to `.env.local` as `MONGODB_URI`

### Local MongoDB

1. Install MongoDB: https://docs.mongodb.com/manual/installation/
2. Start MongoDB service: `mongod`
3. Use connection string: `mongodb://localhost:27017/job-tracker`

### Data Models

**User**
```
- email (String, unique, required)
- name (String, required)
- password (String, hashed with bcryptjs)
- createdAt / updatedAt (Timestamps)
```

**JobApplication**
```
- userId (Reference to User)
- companyName (String, required)
- position (String, required)
- description (String)
- status (String: 'applied'|'interviewing'|'accepted'|'rejected')
- appliedDate (Date, default: now)
- notes (String)
- lastUpdated (Timestamp)
```

**Resume**
```
- userId (Reference to User)
- title (String, required)
- content (String, required)
- createdAt / updatedAt (Timestamps)
```

## Deployment

### Deploy Backend (Express)

**Option 1: Heroku**
```bash
heroku login
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

**Option 2: Railway, Render, or Fly.io**
- Similar process with environment variables
- Deploy from GitHub repository
- Set environment variables in dashboard

### Deploy Frontend (React)

**Option 1: Vercel**
```bash
npm install -g vercel
vercel
# Follow prompts, connect to your backend API
```

**Option 2: Netlify**
- Connect GitHub repository
- Build command: `cd client && npm run build`
- Publish directory: `client/dist`

**Option 3: Any Static Host**
- Build: `npm run build:client`
- Deploy the `client/dist` folder

### Environment Variables

Backend requires:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)
- `PORT` - Server port (default: 3000)

Frontend uses:
- API base URL: Set in `client/src/services/api.ts` (default: `/api`)

## Security Notes

- Passwords are hashed with bcryptjs (10 salt rounds)
- JWT tokens expire after 7 days
- Tokens are sent via Authorization header
- All protected routes validated on backend
- Input validation with Zod schema on API routes
- CORS enabled for development

## Integrating Real AI Features

AI endpoints now use Groq through the OpenAI-compatible SDK. To configure them:

1. **Get API Key**
   ```bash
   # Visit https://console.groq.com/keys
   # Create API key and add to .env.local
   GROQ_API_KEY=gsk-your-key-here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

2. **Install dependencies** (if not already installed)
   ```bash
   cd server
   npm install
   ```

## Troubleshooting

### Database Connection Issues
```
Error: "Database not configured"
→ Set MONGODB_URI in .env.local
→ Verify MongoDB Atlas IP whitelist includes your IP
→ Check connection string is correct
```

### Port Already in Use
```
Client (Vite): Uses port 5173 (configurable in vite.config.ts)
Server (Express): Uses port 3000 (set in .env)
Change with: PORT=3001 npm run dev:server
```

### Authentication Issues
- Clear localStorage and login again
- Check JWT_SECRET is consistent between restarts
- Verify token is being sent in Authorization header

### API Not Responding
- Ensure server is running: `npm run dev:server`
- Check browser Network tab for request details
- Verify proxy configuration in `client/vite.config.ts`
- CORS should be enabled for localhost development

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Check TypeScript errors
cd server && npm run type-check
```

## Project Scripts

### Root Scripts
```bash
npm run dev              # Start both client and server
npm run build           # Build both for production
npm run start           # Start production server
npm run dev:client      # Start only client (Vite)
npm run dev:server      # Start only server (Express)
npm run build:client    # Build client only
npm run build:server    # Build server only
```

### Client Scripts
```bash
cd client
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run lint            # Run ESLint
npm run preview         # Preview production build
```

### Server Scripts
```bash
cd server
npm run dev             # Start with hot reload (tsx watch)
npm run build           # Compile TypeScript
npm run start           # Run compiled server
npm run type-check      # Check types without building
```

## Future Enhancements

- [x] Groq integration for AI insights
- [ ] Email notifications for application updates
- [ ] Calendar integration for interview dates
- [ ] Job recommendation engine
- [ ] Analytics dashboard with statistics
- [ ] Dark mode support
- [ ] Interview scheduler
- [ ] Multiple user roles and teams
- [ ] Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## License

MIT License - use this project freely for personal or commercial purposes.

## Support

For issues or questions:
- Open a GitHub issue
- Check existing issues for solutions
- Include error messages and steps to reproduce
