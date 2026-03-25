# Welcome to BudgetBuddy 👋

This is a project created with React Native frontend and Flask backend running on 2 different servers. Backend is currently running on Render.
This project can be tested through the internet.
<a href ="https://docs.google.com/document/d/1CAI5PpDt-ZQlI6et1LIvM2t7ppMq_3EUZiu3UqgLrbA/edit?usp=sharing"> Click here for more information </a>

## Preview of the app using Expo Go:
1. Install Expo Go from Play Store or Apple Store
2. Scan the QR code or type in the url:

   <a>exp://u.expo.dev/d61f0738-97c8-4d32-99cc-e11bf900a168/group/b4fed26f-dd25-4d9d-b349-3f2d03416da2</a>
   
<div align="center">
   <img width="462" height="458" alt="image" src="https://github.com/user-attachments/assets/65177947-3a7e-4929-82e5-d3712407b24f" />
</div>

## How to run it locally

### Option 1: Using Docker (Recommended)
This is the easiest way to run the entire stack (Database, Backend, and Frontend) in one command.

1. **Install Docker and Docker Compose**.
2. **Configure Frontend**: Create `BudgetBuddy/.env` (if it doesn't exist) and set your local IP:
   ```bash
   EXPO_PUBLIC_API_BASE=http://YOUR_LOCAL_IP:5000
   ```
3. **Run the project**:
   ```bash
   docker-compose up -d
   ```
4. **Scan for Expo Go**: View the frontend logs to see the QR code:
   ```bash
   docker-compose logs -f frontend
   ```

### Option 2: Manual Setup

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python init_db.py
   python run.py
   ```
   *Note: Ensure you have a PostgreSQL database running and configured in your backend `.env`.*

2. **Frontend**:
   ```bash
   cd BudgetBuddy
   npm install
   # Create .env and set EXPO_PUBLIC_API_BASE
   npx expo start
   ```

## Environment Variables
- **Backend**: Configured via `.env` in the `backend/` folder (standard Flask setup).
- **Frontend**: Configured via `.env` in the `BudgetBuddy/` folder. Use `EXPO_PUBLIC_API_BASE` to point to your backend.
