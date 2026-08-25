# 🚀 Quick Start Guide - Phase 3 Authentication

## Running the Application

### Terminal 1: Start Backend
```bash
cd "c:\Users\INDIA\Desktop\New folder (3)\IkiGai\server"
npm run dev
```
Backend runs on: http://localhost:5000

### Terminal 2: Start Frontend
```bash
cd "c:\Users\INDIA\Desktop\New folder (3)\IkiGai\client"
npm run dev
```
Frontend runs on: http://localhost:5173

## Using the Application

### 1. First Time - Register
1. Open http://localhost:5173
2. Click "Register here" link
3. Fill in:
   - Name: Your name
   - Email: your@email.com
   - Password: (min 6 chars)
   - Confirm Password: (must match)
4. Click Register
5. You're logged in! 🎉

### 2. Return - Login
1. Open http://localhost:5173
2. Enter email and password
3. Click Login
4. You're back! 🎉

### 3. Logout
1. Click the "Logout" button in the sidebar
2. You're redirected to login page

## API Endpoints

### Authentication Endpoints (Public)
```
POST   /api/auth/register    → Create new account
POST   /api/auth/login       → Login with email/password
GET    /api/auth/me          → Get current user (requires token)
```

### Protected Data Endpoints (Require Auth Token)
```
GET    /api/todos            → Get your todos
POST   /api/todos            → Create todo
GET    /api/foods            → Get your foods
POST   /api/foods            → Add food
GET    /api/food-logs        → View food logs
GET    /api/room/logs        → View room logs
GET    /api/room/tasks       → View room tasks
GET    /api/money            → View money transactions
```

## Testing with PowerShell

### Register
```powershell
$body = @{ 
  email = "user@example.com"
  password = "pass1234"
  name = "User Name" 
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

### Login
```powershell
$body = @{ 
  email = "user@example.com"
  password = "pass1234" 
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
  
$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

### Use Protected Route
```powershell
$token = "<your_token_from_above>"
$headers = @{ Authorization = "Bearer $token" }

Invoke-WebRequest -Uri "http://localhost:5000/api/todos" `
  -Headers $headers -UseBasicParsing
```

## Architecture Overview

```
User Interface (React)
    ↓
AuthContext (Global State)
    ↓
Login/Register Pages
    ↓
Axios API Client + Interceptors
    ↓
Backend Routes (Express)
    ↓
Auth Middleware (JWT Validation)
    ↓
Controllers (Business Logic)
    ↓
MongoDB Database
```

## Key Security Features

✅ Passwords: Hashed with bcryptjs (10 salt rounds)
✅ Tokens: JWT signed, 7-day expiry
✅ Storage: Token in localStorage, password hash in DB
✅ Transmission: Automatic Bearer token in requests
✅ Validation: Middleware on all protected routes
✅ Errors: Generic messages (no info leakage)

## Troubleshooting

### "Cannot find module bcryptjs"
Solution: Run `npm install` in server directory

### "No token provided" error
Solution: Make sure you're including Authorization header

### "Invalid token" error
Solution: Token may be expired (7 days), login again

### Cannot login after register
Solution: Make sure email and password are correct

### Frontend shows "Loading..."
Solution: Backend may not be running, check terminal

### CORS error
Solution: Make sure backend is running on port 5000

## Files to Know

**Backend**
- `server/.env` - JWT_SECRET and JWT_EXPIRE
- `server/middleware/auth.js` - Token validation
- `server/controllers/authController.js` - Auth logic
- `server/routes/authRoutes.js` - Auth endpoints

**Frontend**
- `client/src/context/AuthContext.jsx` - Auth state
- `client/src/pages/LoginPage.jsx` - Login UI
- `client/src/pages/RegisterPage.jsx` - Register UI
- `client/src/App.jsx` - Route protection

## Password Requirements

✅ Minimum 6 characters
✅ Must be unique per account
✅ Never stored in plain text
✅ Never sent back from server

## Environment Variables

`.env` file in server directory:
```
MONGODB_USERNAME="himeshkarm147_db_user"
MONGODB_PASSWORD="ttLNrQtelBto0iMc"
MONGODB_URI="mongodb://..."
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
JWT_SECRET="your_jwt_secret_key_change_this_in_production"
JWT_EXPIRE="7d"
```

## Common Tasks

### Change JWT expiry
Edit `server/.env`:
```
JWT_EXPIRE="30d"  # 30 days
JWT_EXPIRE="1h"   # 1 hour
```

### Change JWT secret
Edit `server/.env`:
```
JWT_SECRET="your-new-super-secret-key"
```
⚠️ Warning: This will invalidate all existing tokens

### Verify user in database
Connect to MongoDB and query:
```javascript
db.users.find({ email: "user@example.com" })
```
Password field will be hashed

## Next Phase

Ready for Phase 4: **Implement Data Controllers**
- Todo CRUD operations
- Food CRUD operations
- FoodLog operations
- Room operations
- Money operations

---

**Authentication Status: ✅ COMPLETE**
Ready to implement data operations!
