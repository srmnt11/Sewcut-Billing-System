# Quick Start - Sewcut Billing System

## 🚀 Fastest Way to Get Started

### Windows Users (Double-click to run!)
```
start.bat
```

### Linux/Mac Users
```bash
./start.sh
```

That's it! Both servers will start automatically.

---

## 📝 Manual Start

### 1. Start Backend (Terminal 1)
```bash
cd sewcut-backend
python manage.py runserver
```
✅ Backend running at: http://127.0.0.1:8000

### 2. Start Frontend (Terminal 2)
```bash
cd sewcut-frontend
npm install   # First time only
npm run dev
```
✅ Frontend running at: http://localhost:5173

---

## 🔑 Login

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[BACKEND_SUMMARY.md](BACKEND_SUMMARY.md)** - What was built
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation

---

## ⚡ Quick Commands

### Backend Commands
```bash
cd sewcut-backend

# Create new superuser
python manage.py createsuperuser

# Access admin panel
# Open: http://127.0.0.1:8000/admin

# Reset database
rm db.sqlite3
python manage.py migrate
python create_superuser.py

# Install dependencies
pip install -r requirements.txt
```

### Frontend Commands
```bash
cd sewcut-frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🔍 Common Issues

### "Port already in use"
Backend: Change port
```bash
python manage.py runserver 8001
```

Frontend: Vite will auto-assign a new port

### "Module not found" (Backend)
```bash
cd sewcut-backend
pip install -r requirements.txt
```

### "Cannot find module" (Frontend)
```bash
cd sewcut-frontend
npm install
```

### "CORS Error"
Make sure backend is running on port 8000

### Can't login
- Check backend is running
- Use: admin / admin123
- Check browser console for errors

---

## 🎯 Features

✅ User Management & Authentication
✅ Client Management
✅ Supplier Management  
✅ Quotations with Line Items
✅ Invoices/Billing with Line Items
✅ Dashboard Analytics
✅ Revenue Tracking
✅ Automatic Calculations

---

## 🛠️ Tech Stack

**Backend:**
- Django 5.0.1
- Django REST Framework
- JWT Authentication
- SQLite Database

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Query

---

## 📞 Need Help?

1. Check the server logs in terminal
2. Check browser console (F12)
3. Review [SETUP_GUIDE.md](SETUP_GUIDE.md)
4. Review [API_REFERENCE.md](API_REFERENCE.md)

---

**Happy Coding! 🎉**
