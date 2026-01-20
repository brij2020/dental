# DCMS - Dental Clinic Management System 🦷

A full-stack web application for managing dental clinics, patient records, appointments, and consultations.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Setup](#environment-setup)
- [API Documentation](#api-documentation)
- [Project Architecture](#project-architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

DCMS is a comprehensive Dental Clinic Management System designed to streamline clinic operations, manage patient records, schedule appointments, and track medical consultations. The system includes a modern React frontend with a robust Node.js backend.

### Key Features

- **Patient Management**: Create, update, and manage patient records
- **Appointment Scheduling**: Schedule and manage patient appointments
- **Consultation Tracking**: Record and track patient consultations
- **Clinic Management**: Manage clinic settings and configurations
- **Doctor Schedules**: Manage doctor availability and leaves
- **Medical Conditions**: Track patient medical conditions
- **User Authentication**: Secure JWT-based authentication
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## 🛠 Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Ant Design** - UI components
- **Supabase JS** - Backend service integration

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Swagger/OpenAPI** - API documentation
- **Winston** - Logging

## 📁 Project Structure

```
dcms-dental-clinic/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── lib/                # Utilities and API client
│   │   ├── hooks/              # Custom React hooks
│   │   ├── state/              # State management
│   │   ├── assets/             # Images, icons, etc.
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── public/                 # Public assets
│   ├── package.json            # Frontend dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── vite.config.ts          # Vite config
│   └── .env.example            # Environment template
│
├── backend/                     # Node.js + Express + MongoDB
│   ├── app/
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Express middleware
│   │   ├── services/           # Business logic
│   │   ├── config/             # Configuration files
│   │   ├── constants/          # Application constants
│   │   └── util/               # Utility functions
│   ├── logs/                   # Application logs
│   ├── supabase/               # Supabase functions
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Application entry point
│   ├── swagger.js              # Swagger config
│   └── .env.example            # Environment template
│
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│
├── package.json                # Monorepo root config
├── .gitignore                  # Git ignore patterns
├── MONOREPO_SETUP.md          # Monorepo documentation
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and **npm** (or yarn)
- **MongoDB** (local or MongoDB Atlas)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/dcms-dental-clinic.git
   cd dcms-dental-clinic
   ```

2. **Install dependencies:**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables:**
   
   **Frontend (.env.local):**
   ```bash
   cp frontend/.env.example frontend/.env.local
   # Edit with your values
   ```

   **Backend (.env):**
   ```bash
   cp backend/.env.example backend/.env
   # Edit with your values
   ```

## ▶️ Running the Application

### Start Both Frontend and Backend
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend API on http://localhost:8080

### Run Separately

**Terminal 1 - Backend:**
```bash
npm run dev:backend
# or with watch mode
npm run watch:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### Build for Production

```bash
npm run build
```

Individual builds:
```bash
npm run build:frontend
npm run build:backend
```

## 🔧 Environment Setup

### Frontend Configuration

Create `frontend/.env.local`:

```env
# API Configuration
VITE_API_URL=http://localhost:8080

# Supabase Configuration (if using)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Backend Configuration

Create `backend/.env`:

```env
# Server
PORT=8080
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dcms
DB_NAME=dcms

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

## 📚 API Documentation

### Swagger/OpenAPI UI

Once the backend is running, visit:
```
http://localhost:8080/api-docs
```

### Main Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

#### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

#### Clinics
- `GET /api/clinics` - List clinics
- `POST /api/clinics` - Create clinic
- `GET /api/clinics/:id` - Get clinic details
- `PUT /api/clinics/:id` - Update clinic

#### Consultations
- `GET /api/consultation` - List consultations
- `POST /api/consultation` - Create consultation
- `GET /api/consultation/:id` - Get consultation
- `PUT /api/consultation/:id` - Update consultation

For complete API documentation, see [Backend API Docs](./backend/PATIENT_API.md)

## 🏗 Project Architecture

### Frontend Architecture

```
React Component Tree
    ├── App (Router)
    │   ├── ProtectedRoute (Auth wrapper)
    │   ├── DashboardLayout
    │   │   ├── Sidebar (Navigation)
    │   │   ├── Topbar (Header)
    │   │   └── Main Content
    │   └── Auth Pages
    ├── State (Context API)
    │   ├── AuthContext
    │   └── Other contexts
    └── Services
        └── apiClient (Axios)
```

### Backend Architecture

```
Express Server
├── Routes (API endpoints)
├── Controllers (Request handlers)
├── Services (Business logic)
├── Models (Database schemas)
├── Middleware (Auth, validation)
└── Config (Database, logger)
```

### Data Flow

```
Frontend (React)
    ↓ (HTTP/Axios)
Backend API (Express)
    ↓ (Mongoose)
MongoDB Database
```

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify recommended)

1. Build the frontend:
   ```bash
   npm run build:frontend
   ```

2. Deploy `frontend/dist` folder to:
   - **Vercel**: Connect GitHub repo, auto-deploys
   - **Netlify**: Deploy folder or connect GitHub
   - **GitHub Pages**: Push to gh-pages branch

### Backend Deployment (Heroku/Railway/Render recommended)

1. Set up deployment platform account
2. Add environment variables to platform
3. Deploy the `backend` folder
4. Update frontend API URL to point to deployed backend

**Update frontend env for production:**
```env
VITE_API_URL=https://your-backend-domain.com
```

## 📝 Key Features Documentation

- [Clinic Panel Integration](./backend/CLINIC_PANEL_INTEGRATION.md)
- [Patient Form Component Guide](./frontend/components/PATIENT_FORM_COMPONENT_GUIDE.md)
- [API Client Documentation](./frontend/src/lib/apiClient.ts)
- [Backend Controllers Analysis](./backend/APPOINTMENT_CONTROLLER_ANALYSIS.md)

## 🔐 Security

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Environment variable management
- Input validation on backend

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes: `git commit -m 'Add amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📄 License

ISC

## 👨‍💻 Support

For issues and questions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Include screenshots or error logs

---

**Happy coding! 🚀**
