# DCMS Dental Clinic - Monorepo Setup

This repository contains both the frontend and backend for the Dental Clinic Management System.

## Project Structure

```
dcms-dental-clinic/
├── frontend/              # React + Vite + TypeScript frontend
├── backend/               # Node.js + Express + MongoDB backend
├── package.json          # Root workspace configuration
└── README.md            # Main documentation
```

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd dcms-dental-clinic
```

2. **Install dependencies for all workspaces:**
```bash
npm run install-all
```

### Running the Application

#### Option 1: Run both frontend and backend together
```bash
npm run dev
```

#### Option 2: Run separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

#### Option 3: Watch mode for backend only
```bash
npm run watch:backend
```

## Frontend Setup

**Location:** `frontend/`

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **State Management:** React Context API

**Environment Variables** (frontend/.env.local):
```
VITE_API_URL=http://localhost:8080
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-key>
```

**Development:**
```bash
npm run dev:frontend      # Start dev server (http://localhost:5173)
npm run build:frontend    # Build for production
npm run lint              # Run ESLint
npm run preview           # Preview production build
```

## Backend Setup

**Location:** `backend/`

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB
- **Authentication:** JWT + bcryptjs
- **API Documentation:** Swagger/OpenAPI

**Environment Variables** (backend/.env):
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/dcms
DB_NAME=dcms
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

**Development:**
```bash
npm run dev:backend       # Start server (http://localhost:8080)
npm run watch:backend     # Watch mode with nodemon
```

## Building for Production

Build both frontend and backend:
```bash
npm run build
```

Or individually:
```bash
npm run build:frontend    # Outputs to frontend/dist
npm run build:backend     # Ready to deploy from backend/
```

## Frontend Routes

- `/` - Dashboard
- `/auth/login` - Login
- `/auth/signup` - Registration
- `/patients` - Patient Management
- `/appointments` - Appointment Scheduling
- `/clinics` - Clinic Settings
- `/consultation` - Consultation Notes

## Backend API Endpoints

Swagger documentation available at: `http://localhost:8080/api-docs`

### Main Routes:
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET/POST /api/patients` - Patient CRUD
- `GET/POST /api/appointments` - Appointment CRUD
- `GET/POST /api/clinics` - Clinic CRUD
- `GET/POST /api/consultation` - Consultation CRUD

## Git Workflow

Both projects are now in a single repository. Branch naming convention:
- `main` - Production ready
- `develop` - Development branch
- `feature/xxx` - Feature branches
- `bugfix/xxx` - Bug fix branches

## Common Issues

### Frontend can't connect to backend
- Ensure backend is running on `http://localhost:8080`
- Check CORS settings in `backend/server.js`
- Verify environment variables in `frontend/.env.local`

### MongoDB connection failed
- Ensure MongoDB is running locally or Atlas connection string is correct
- Check `MONGODB_URI` in `backend/.env`

### Port already in use
- Frontend: `npm run dev:frontend -- --port 5174`
- Backend: Change `PORT` in `backend/.env`

## Deployment

### Frontend (Vercel/Netlify recommended)
```bash
npm run build:frontend
# Deploy the frontend/dist folder
```

### Backend (Heroku/Railway/Render recommended)
```bash
# Push backend folder to deployment platform
# Set environment variables on platform
```

## Documentation

- [Backend API Documentation](./backend/PATIENT_API.md)
- [Clinic Panel Integration](./backend/CLINIC_PANEL_INTEGRATION.md)
- [Patient Form Component Guide](./frontend/components/PATIENT_FORM_COMPONENT_GUIDE.md)
