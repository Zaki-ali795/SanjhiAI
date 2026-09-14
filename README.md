# 🌟 Sanjhi (سانجھی) — AI-Powered Community Savings & ROSCA Platform

> **🌐 Live Hosted Web Application:** [https://sanjhiai.netlify.app](https://sanjhiai.netlify.app)
> srs link:https://drive.google.com/file/d/16-J9s5UPJ18ei9UQ1Cw3NLptB37Czt89/view?usp=drive_link

> **📱 Android APK Binary Location:**  
> `android/app/build/outputs/apk/debug/app-debug.apk`
> apk link:https://drive.google.com/file/d/15g_shbAmqazfkVIPF5wT43mZ9mDz1CMw/view?usp=drive_link

---

## 📖 Overview

**Sanjhi** is a digital platform for Peer-to-Peer **ROSCA (Rotating Savings and Credit Associations)**, known culturally as **Kameti (کمیٹی)** or **BC (Bachat Committee)** in Pakistan and South Asia.

By combining an immutable PostgreSQL ledger, AI-driven fraud detection, an automated WhatsApp conversational voice bot, instant JazzCash/EasyPaisa deep-linking, and a mathematical **Trust Score engine (0–1000)**, Sanjhi transforms informal cash pools into secure, transparent, and legally accountable digital savings communities.

---

## ✨ Key Features

### 1. 🛡️ Real-Time Trust Scoring Engine (0–1000)
* **Mathematical Reliability Formula**: Evaluates on-time payment records, completed pool cycles, CNIC identity verification, and dispute track records.
* **Tiered Membership**: Automatically badges members into **Diamond**, **Gold**, **Silver**, and **Bronze** tiers to ensure high-value pools remain safe and reliable.

### 2. 🤖 Sanjhi AI Multilingual Assistant & Voice Bot
* **Web & In-App Assistant**: Powered by Groq's high-speed LLaMA 3.3 70B model with full Urdu and English conversational understanding.
* **WhatsApp Voice & Text Bot**: Integrated via Baileys & Whisper Large v3, allowing non-tech-savvy community members to check turn schedules, verify payments, and submit receipts simply by sending Urdu voice notes.

### 3. 💸 Dual JazzCash & EasyPaisa Quick-Pay Integration
* Deep-links directly to **JazzCash** (`com.techlogix.mobilinkcustomer`) and **EasyPaisa** (`pk.com.telenor.phoenix`) apps with automatic account number clipboard copying.

### 4. ⚡ Zero-Latency 0ms Offline Asset Caching
* **PWA Service Worker (`public/sw.js`)**: Automatically stores all static scripts, styles, images, and fonts directly in phone memory for instantaneous startup even on poor cellular networks.
* **Native Android WebView Serving**: All assets are bundled directly into the APK binary (`android/app/src/main/assets/public/`).

### 5. 🧑‍💼 Super Admin Governance & CNIC Verification
* Operational dashboard with Circulating Volume analytics, automated dispute resolution queues, and two-sided NADRA-compliant CNIC verification.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Tailwind CSS v4, Vite 7, React Router 7 |
| **Mobile Runtime** | Capacitor 8 (Android SDK 34+) |
| **Backend** | Node.js (ES Modules), Express 4.19, PostgreSQL (`pg`) |
| **AI & Voice** | Groq SDK (LLaMA 3.3 70B, Whisper Large v3), Fluent-FFmpeg |
| **WhatsApp Engine** | `@whiskeysockets/baileys` (Socket WebSocket) |
| **Security & Auth** | JWT (`jsonwebtoken`), BCrypt, Multer, Nodemailer |

---

## 📁 Repository Structure

```
sanjhi/
├── android/                   # Capacitor native Android Gradle project
│   └── app/build/outputs/apk/ # Output location for app-debug.apk
├── backend/                   # Node.js Express REST API & services
│   ├── controller/            # Route controllers (Auth, Committees, Dashboard, Admin)
│   ├── middleware/            # JWT authentication & role-based access
│   ├── routes/                # Express API route declarations
│   ├── services/              # AI Assistant, WhatsApp Bot, and Ledger services
│   └── utilities/             # OTP, Email Transporter, AI Judge & Agents
├── database/                  # Database architecture & SQL schema
│   └── DDL/sanjhiAI_DDL.sql   # PostgreSQL database schema & tables
├── public/                    # Static assets, logos, and PWA Service Worker (sw.js)
├── scripts/                   # Android Gradle build patch utilities
├── src/                       # React Frontend Application
│   ├── components/            # Reusable UI components (Icon engine, Drawer, Modals)
│   ├── context/               # Global state providers (NavDrawerContext)
│   ├── hooks/                 # Custom React hooks (useCountUp, useInView)
│   ├── layouts/               # Responsive layout wrappers
│   ├── pages/                 # Auth, Dashboard, Committees, Payments, Profile, Admin
│   ├── services/              # Frontend API client service modules
│   └── utils/                 # Unified backend URL and mobile payment deep-linkers
├── instructions.md            # Complete step-by-step local setup guide
└── README.md                  # Project overview & documentation
```

---

## 🚀 Getting Started

For detailed step-by-step instructions on setting up the database, environment variables, running dev servers, and building the Android APK, refer to:

👉 **[Local Setup Instructions (`instructions.md`)](file:///d:/hack/sanjhi/instructions.md)**
* the instructions.md contains the instruction to run the commands

```bash
# Quick Start
npm install
npm run dev
```

---

## 📄 License

This project is built for the **Sanjhi AI** Community Savings Platform. All rights reserved.
made with love by Huzaifa and ahmed
