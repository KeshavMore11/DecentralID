# MongoDB Authentication Setup Guide

## Prerequisites
- Node.js installed (v14 or higher)
- MongoDB Atlas account (free tier is sufficient)

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (choose the free tier)

### 2. Create Database User
1. In Atlas, go to **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Set username and password (save these!)
5. Set user privileges to **Read and write to any database**
6. Click **Add User**

### 3. Whitelist IP Address
1. Go to **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
4. Click **Confirm**

### 4. Get Connection String
1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`)

## Backend Configuration

### 1. Update .env File
Edit `backend/.env` and replace the MongoDB URI:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ssi_auth?retryWrites=true&w=majority
JWT_SECRET=ssi-jwt-secret-key-2024-change-in-production
PORT=3000
NODE_ENV=development
```

**Important:** Replace:
- `YOUR_USERNAME` with your MongoDB Atlas username
- `YOUR_PASSWORD` with your MongoDB Atlas password
- `YOUR_CLUSTER` with your cluster name (from connection string)

### 2. Seed the Database
Run this command to create demo users in MongoDB:

```bash
cd backend
npm run seed
```

This will create:
- **University**: `admin@university.edu` / `password`
- **Verifier**: `org_demo` / `demo_key`

## Running the Application

### Start the Backend Server
```bash
cd backend
npm start
```

You should see:
```
✓ Successfully connected to MongoDB Atlas!
✓ Server running on http://localhost:3000
✓ API ready at http://localhost:3000/api/auth
```

### Start the Frontend Server
In a new terminal:
```bash
cd ..
python -m http.server 8000
```

### Access the Application
Open your browser to: http://localhost:8000

## Testing the Authentication

### Test University Login
1. Click "Issue Credentials"
2. Enter credentials:
   - Email: `admin@university.edu`
   - Password: `password`
3. Should successfully log in to the issuer portal

### Test Verifier Login
1. Click "Verify Credentials"
2. Enter credentials:
   - Org ID: `org_demo`
   - Password: `demo_key`
3. Should successfully log in to the verifier portal

## Troubleshooting

### Backend won't connect to MongoDB
- Check your MongoDB Atlas connection string in `.env`
- Verify your IP address is whitelisted in Atlas
- Confirm database user credentials are correct

### CORS errors in browser console
- Make sure backend is running on port 3000
- Check that frontend is on port 8000
- Verify CORS settings in `server.js`

### "Cannot POST /api/auth/..." errors
- Ensure backend server is running
- Check the API endpoint in browser DevTools Network tab
- Verify the URL is http://localhost:3000

## API Endpoints

### University
- **POST** `/api/auth/university/login` - Login
- **POST** `/api/auth/university/register` - Register new university

### Verifier
- **POST** `/api/auth/verifier/login` - Login
- **POST** `/api/auth/verifier/register` - Register new verifier

## Creating New Users

You can create new users via the API or by modifying the seed script.

### Via curl:
```bash
# Register new university
curl -X POST http://localhost:3000/api/auth/university/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@university.edu","password":"newpass123","universityName":"New University"}'

# Register new verifier
curl -X POST http://localhost:3000/api/auth/verifier/register \
  -H "Content-Type: application/json" \
  -d '{"orgId":"org_new","password":"newpass123","organizationName":"New Organization"}'
```

## Security Notes

⚠️ **For Production:**
1. Change the `JWT_SECRET` to a strong random string
2. Use environment-specific `.env` files
3. Implement rate limiting on login endpoints
4. Add password complexity requirements
5. Use HTTPS for all connections
6. Restrict CORS to specific domains
7. Add IP whitelisting in MongoDB Atlas
