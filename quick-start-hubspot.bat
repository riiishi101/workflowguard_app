@echo off
echo ========================================
echo   WorkflowGuard - HubSpot Integration
echo ========================================
echo.

echo Checking if environment files exist...
if not exist "backend\.env" (
    echo Creating backend .env file...
    copy "backend\env.example" "backend\.env"
    echo.
    echo ⚠️  IMPORTANT: Please update backend\.env with your:
    echo    - Database connection string
    echo    - HubSpot Client ID and Secret
    echo    - JWT Secret
    echo.
)

if not exist "frontend\.env" (
    echo Creating frontend .env file...
    copy "frontend\env.example" "frontend\.env"
    echo.
    echo ⚠️  IMPORTANT: Please update frontend\.env with your:
    echo    - HubSpot Client ID
    echo    - Set VITE_DEV_MODE="false"
    echo.
)

echo.
echo Starting backend server...
echo.
cd backend
start "Backend Server" cmd /k "npm run start:dev"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting frontend server...
echo.
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   Application Starting...
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Next steps:
echo 1. Update environment files with your credentials
echo 2. Set up your HubSpot app at: https://developers.hubspot.com/
echo 3. Configure your database (PostgreSQL or Supabase)
echo 4. Complete OAuth flow in the app
echo.
echo For detailed setup instructions, see: HUBSPOT_INTEGRATION_SETUP.md
echo.
pause 