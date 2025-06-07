# Welcome to BudgetBuddy 👋

This is a project created with React Native frontend and Flask backend running on 2 different servers.

## Get started

1. Configure backend  

   Open a terminal window for backend

   Create a .env file in .\backend with the same elements as .env.example  

   Then in .\backend run  
   ```bash
   pip install -r requirements.txt
   python init_db.py
   python run.py
   ```
2. Open a new terminal for frontend

3. Configure frontend  

   Change the API in .\frontend\constants\api.js to your flask 2nd host  

   Then in .\frontend run  
   ```bash
   npm install
   ```
4. Start the app

   ```bash
   npx expo start
   ```
    