# 🛠️ Sanjhi — Local Development & Setup Guide

This guide walks you through setting up and running the entire **Sanjhi** platform (PostgreSQL Database, Node.js/Express Backend, React Vite Frontend, and Android APK Build) on your local machine.

---

## 📋 Prerequisites

Make sure you have the following installed on your machine:
* **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
* **npm**: v9.0.0 or higher
* **PostgreSQL**: v14.0 or higher ([Download PostgreSQL](https://www.postgresql.org/download/))
* **Git**: ([Download Git](https://git-scm.com/))
* **Android Studio & SDK 34+** *(Optional, only if building/running the native Android APK)*
* **Java JDK 17 or 21** *(For Android Gradle builds)*

---

## 🚀 Step 1: Clone the Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/MuhammadAhmed1089/SanjhiAI.git
cd SanjhiAI

# Install all npm dependencies (Frontend + Backend + Capacitor)
npm install
```

---

## 🗄️ Step 2: PostgreSQL Database Setup

1. Open PostgreSQL CLI (`psql`) or pgAdmin:
   ```bash
   psql -U postgres
   ```
2. Create the database:
   ```sql
   CREATE DATABASE sanjhi_db;
   ```
3. Run the provided schema script to create all required tables, indexes, triggers, and constraints:
   ```bash
   psql -U postgres -d sanjhi_db -f database/DDL/sanjhiAI_DDL.sql
   ```

---

## ⚙️ Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# PostgreSQL Connection
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sanjhi_db

# Security & Authentication
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=your_session_secret_key_here

# Groq AI & Voice Intelligence (For Assistant & WhatsApp Voice Bot)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Email / OTP Service (SMTP Configuration)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password_here

# Frontend API URL
VITE_API_URL=http://localhost:3000/api
```

---

## 💻 Step 4: Run the Application Locally

You can run both the Frontend (Vite Dev Server) and Backend (Express Server with Nodemon) together with a single command:

```bash
npm run dev
```

* **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
* **Backend REST API**: [http://localhost:3000](http://localhost:3000)
* **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

*(Optional: If you prefer separate terminals)*
```bash
# Terminal 1: Backend Server
npm run server

# Terminal 2: Frontend Client
npm run client
```

---

## 🤖 Step 5: WhatsApp AI Bot Setup (Baileys)

1. When the backend starts (`npm run server`), a QR code will print in your terminal.
2. Open **WhatsApp** on your phone > **Linked Devices** > **Link a Device**.
3. Scan the terminal QR code to link your bot number.
4. Users can now send text and voice notes in Urdu/English to manage pools and check dues automatically!

---

## 📱 Step 6: Android APK Build & Sync (Capacitor)

To build the native Android APK containing bundled offline assets:

```bash
# 1. Build the production web bundle and sync native Android project
npm run build:apk
```

The generated debug APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Running on an Android Emulator or Physical Device via Android Studio:
```bash
# Sync web assets to Android
npm run cap:sync

# Open the project in Android Studio
npx cap open android
```
Then press **Run (Shift + F10)** in Android Studio to test on your emulator or connected device.

---

## 🧪 Step 7: Linting & Code Verification

```bash
# Run ESLint to verify code quality
npm run lint

# Run production build validation
npm run build
```
