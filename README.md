# Self-Sovereign Identity (SSI) Progressive Web App

A Progressive Web App for Academic Credential Verification using Decentralized Identifiers (DIDs) and Verifiable Credentials with MongoDB backend authentication.

## 🎯 Overview

This project implements a complete Self-Sovereign Identity system that enables:
- **Students**: Create and manage decentralized digital identities (DIDs), store academic credentials securely, and share credentials selectively
- **Universities**: Issue verifiable academic credentials to students
- **Verifiers**: Verify credentials without accessing sensitive information using zero-knowledge proofs

## 🔑 Key Features

### Core Identity Features
- **Decentralized Identity (DID)**: Create DIDs without relying on centralized authorities
- **Verifiable Credentials**: W3C-compliant academic credentials
- **Selective Disclosure**: Share only necessary information using zero-knowledge proofs
- **DID-Based Authentication**: Passwordless challenge-response authentication
- **Privacy-Preserving**: Cryptographic proofs without revealing sensitive data

### Application Features
- **Multi-Role Support**: Student, University, and Verifier portals
- **Secure Backend**: MongoDB Atlas with JWT authentication
- **Progressive Web App**: Works offline on mobile and desktop browsers
- **Real-time Updates**: Dashboard with refresh functionality
- **Responsive Design**: Modern UI with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier)
- Python 3.x (for frontend server)

### 1. Clone the Repository
```bash
git clone https://github.com/kash-gg/Project_SSI.git
cd Project_SSI
```

### 2. Setup Backend

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure MongoDB
1. Create a [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier)
3. Add a database user with read/write permissions
4. Whitelist your IP address (or allow access from anywhere for development)
5. Get your connection string

#### Create .env File
Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ssi_auth?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
NODE_ENV=development
```

#### Seed the Database
```bash
npm run seed
```

This creates demo accounts:
- **University**: `admin@university.edu` / `password`
- **Verifier**: `org_demo` / `demo_key`

#### Start Backend Server
```bash
npm start
```

You should see:
```
✓ Successfully connected to MongoDB Atlas!
✓ Server running on http://localhost:3000
✓ API ready at http://localhost:3000/api/auth
```

### 3. Start Frontend

In a new terminal from project root:
```bash
python -m http.server 5500
```

### 4. Access the Application

Open your browser to: **http://localhost:5500**

## 📱 Usage Guide

### For Students
1. Click **"My Credentials"** on the home page
2. Complete the onboarding process
3. Create your DID (Decentralized Identifier)
4. Request credentials from universities
5. Share credentials selectively with verifiers

### For Universities (Issuers)
1. Click **"Issue Credentials"**
2. Login with: `admin@university.edu` / `password`
3. Issue academic credentials to students
4. Track issued credentials

### For Verifiers (Employers)
1. Click **"Verify Credentials"**
2. Login with: `org_demo` / `demo_key`
3. Request credential proofs from students
4. Verify credentials without accessing sensitive data

## 🏗️ Architecture

### Frontend (Progressive Web App)
- **UI Layer**: Responsive HTML/CSS with vanilla JavaScript
- **Identity Layer**: DID management, credential operations, selective disclosure
- **Crypto Layer**: Web Crypto API for signatures and hashing
- **Storage Layer**: Encrypted IndexedDB for secure local storage
- **PWA Features**: Service workers for offline support

### Backend (Node.js/Express)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Database**: MongoDB Atlas with Mongoose ODM
- **API**: RESTful endpoints for user management
- **Security**: CORS, input validation, rate limiting ready

### Key Technologies
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express, MongoDB, JWT
- **Crypto**: Web Crypto API, bcryptjs
- **Standards**: W3C DID Core, W3C Verifiable Credentials
- **Deployment**: Render (backend), GitHub Pages (frontend)

## 📡 API Documentation

### Base URL
- **Local**: `http://localhost:3000`
- **Production**: `https://your-app.onrender.com`

### University Endpoints

#### Register University
```http
POST /api/auth/university/register
Content-Type: application/json

{
  "email": "admin@university.edu",
  "password": "securepassword",
  "universityName": "Example University"
}
```

#### Login University
```http
POST /api/auth/university/login
Content-Type: application/json

{
  "email": "admin@university.edu",
  "password": "password"
}
```

### Verifier Endpoints

#### Register Verifier
```http
POST /api/auth/verifier/register
Content-Type: application/json

{
  "orgId": "org_example",
  "password": "securepassword",
  "organizationName": "Example Organization"
}
```

#### Login Verifier
```http
POST /api/auth/verifier/login
Content-Type: application/json

{
  "orgId": "org_demo",
  "password": "demo_key"
}
```

### Response Format
All endpoints return JSON:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "university"
  }
}
```

## 🚀 Deployment

### Backend Deployment (Render)

The backend is configured for automatic deployment to Render.

#### Option 1: Using render.yaml (Recommended)
1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign in
3. Click **New +** → **Web Service**
4. Connect repository: `kash-gg/Project_SSI`
5. Render auto-detects `render.yaml`
6. Add `MONGODB_URI` environment variable
7. Click **Create Web Service**

#### Option 2: Manual Setup
1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables (see [DEPLOYMENT.md](./backend/DEPLOYMENT.md))

### Frontend Deployment (GitHub Pages)

The frontend can be deployed to GitHub Pages or any static hosting service.

1. Update `js/api.js` with your Render backend URL
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Select `main` branch as source

### Environment Variables for Production

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NODE_ENV` | Set to `production` | Yes |
| `PORT` | Server port (auto-set by Render) | No |

See [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md) for detailed deployment instructions.

## 🔐 Security

### Development
- Demo credentials provided for testing
- CORS enabled for localhost
- JWT tokens with 24-hour expiry

### Production Recommendations
⚠️ **Before deploying to production:**
1. Change `JWT_SECRET` to a strong random string
2. Implement rate limiting on authentication endpoints
3. Add password complexity requirements
4. Use HTTPS for all connections
5. Restrict CORS to specific domains
6. Enable IP whitelisting in MongoDB Atlas
7. Implement refresh token rotation
8. Add logging and monitoring
9. Enable 2FA for admin accounts

### Privacy Features
- Private keys never leave the user's device
- All credentials encrypted at rest in IndexedDB
- Zero-knowledge proofs for selective disclosure
- No central authority or single point of failure
- Minimal data collection

## 🧪 Testing

### Test University Login
```bash
curl -X POST http://localhost:3000/api/auth/university/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.edu","password":"password"}'
```

### Test Verifier Login
```bash
curl -X POST http://localhost:3000/api/auth/verifier/login \
  -H "Content-Type: application/json" \
  -d '{"orgId":"org_demo","password":"demo_key"}'
```

## 📋 Project Structure

```
Project_SSI/
├── backend/                 # Node.js backend
│   ├── models/             # MongoDB models (User.js)
│   ├── routes/             # API routes (auth.js)
│   ├── middleware/         # Auth middleware
│   ├── scripts/            # Utility scripts (seed.js)
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   ├── .env                # Environment variables (not in git)
│   └── README.md           # Backend setup guide
├── js/                      # Frontend JavaScript
│   ├── components/         # UI components
│   ├── api.js              # API client
│   ├── app.js              # Main app logic
│   ├── did-manager.js      # DID operations
│   ├── credential-manager.js   # Credential operations
│   ├── selective-disclosure.js # ZKP implementation
│   ├── did-auth.js         # Authentication
│   ├── crypto-utils.js     # Cryptographic utilities
│   └── storage.js          # IndexedDB wrapper
├── icons/                   # PWA icons
├── index.html              # Main HTML file
├── styles.css              # Application styles
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── render.yaml             # Render deployment config
└── README.md               # This file
```

## 🐛 Troubleshooting

### Backend Issues

**MongoDB connection fails**
- Verify connection string in `.env`
- Check IP whitelist in MongoDB Atlas
- Confirm database user credentials

**CORS errors**
- Ensure backend runs on port 3000
- Verify frontend runs on port 8000
- Check CORS settings in `server.js`

**Cannot POST /api/auth/... errors**
- Confirm backend server is running
- Check API endpoint in DevTools Network tab
- Verify API URL in `js/api.js`

### Frontend Issues

**DID creation fails**
- Check browser console for errors
- Verify IndexedDB is enabled
- Clear browser storage and try again

**Credentials not displaying**
- Check if wallet is initialized
- Verify credential format
- Inspect IndexedDB storage

## 📚 Additional Documentation

- **[Backend Setup Guide](./backend/README.md)** - Detailed MongoDB and backend configuration
- **[Deployment Guide](./backend/DEPLOYMENT.md)** - Production deployment instructions
- **[Implementation Plan](./implementation_plan.md)** - Technical architecture and design decisions

## 🎓 Educational Purpose

This project demonstrates:
- Self-Sovereign Identity (SSI) principles
- Decentralized Identifiers (DIDs) per W3C standards
- Verifiable Credentials (VCs) per W3C standards
- Zero-Knowledge Proofs for selective disclosure
- Modern PWA development
- Full-stack web application architecture
- Secure authentication patterns

## 📄 License

MIT License - Feel free to use this project for educational purposes.

## 👥 Contributing

This is an educational project. Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- W3C for DID and VC specifications
- MongoDB for database hosting
- Render for backend hosting
- The SSI community for pioneering work in decentralized identity

---

**Made with ❤️ for the decentralized web**
