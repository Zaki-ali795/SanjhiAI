# 📋 Repository Migration & File Copy Tracker

> **Purpose**: Track file copying progress to the new repository so contributors don't duplicate work.
> 
> **Instructions for Contributors**:
> 1. Check if the file is marked as `[x] Copied` before working on it.
> 2. Once you copy a file to the new repo, change `[ ]` to `[x]` (and optionally add your name/date).
> 3. Commit this tracker file so all contributors stay in sync.

---

## 📊 Summary
- **Total Files**: 230
- **Status**: 183 / 230 Copied
- **Progress**: `[████████████████░░░░] 80%` 

---

## 📁 Repository Directory Structure Overview

```text
SanjhiAI/
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   ├── androidTest/
│   │   │   │   └── java/
│   │   │   │       └── com/
│   │   │   │           └── getcapacitor/
│   │   │   │               └── myapp/
│   │   │   │                   └── ExampleInstrumentedTest.java
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   │   └── com/
│   │   │   │   │       └── sanjhi/
│   │   │   │   │           └── app/
│   │   │   │   │               └── MainActivity.java
│   │   │   │   ├── res/
│   │   │   │   │   ├── drawable/
│   │   │   │   │   │   ├── ic_launcher_background.xml
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-hdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-mdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xxxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-hdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-mdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xxxhdpi/
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-v24/
│   │   │   │   │   │   └── ic_launcher_foreground.xml
│   │   │   │   │   ├── layout/
│   │   │   │   │   │   └── activity_main.xml
│   │   │   │   │   ├── mipmap-anydpi-v26/
│   │   │   │   │   │   ├── ic_launcher_round.xml
│   │   │   │   │   │   └── ic_launcher.xml
│   │   │   │   │   ├── mipmap-hdpi/
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   ├── ic_launcher_round.png
│   │   │   │   │   │   └── ic_launcher.png
│   │   │   │   │   ├── mipmap-mdpi/
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   ├── ic_launcher_round.png
│   │   │   │   │   │   └── ic_launcher.png
│   │   │   │   │   ├── mipmap-xhdpi/
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   ├── ic_launcher_round.png
│   │   │   │   │   │   └── ic_launcher.png
│   │   │   │   │   ├── mipmap-xxhdpi/
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   ├── ic_launcher_round.png
│   │   │   │   │   │   └── ic_launcher.png
│   │   │   │   │   ├── mipmap-xxxhdpi/
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   ├── ic_launcher_round.png
│   │   │   │   │   │   └── ic_launcher.png
│   │   │   │   │   ├── values/
│   │   │   │   │   │   ├── ic_launcher_background.xml
│   │   │   │   │   │   ├── strings.xml
│   │   │   │   │   │   └── styles.xml
│   │   │   │   │   └── xml/
│   │   │   │   │       └── file_paths.xml
│   │   │   │   └── AndroidManifest.xml
│   │   │   └── test/
│   │   │       └── java/
│   │   │           └── com/
│   │   │               └── getcapacitor/
│   │   │                   └── myapp/
│   │   │                       └── ExampleUnitTest.java
│   │   ├── .gitignore
│   │   ├── build.gradle
│   │   ├── capacitor.build.gradle
│   │   └── proguard-rules.pro
│   ├── gradle/
│   │   └── wrapper/
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── .gitignore
│   ├── build.gradle
│   ├── capacitor.settings.gradle
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── mailmap.txt
│   ├── settings.gradle
│   └── variables.gradle
├── backend/
│   ├── assistant/
│   │   ├── retriever.js
│   │   ├── schema.js
│   │   └── seedDocs.js
│   ├── bot/
│   │   ├── tools/
│   │   │   ├── calendar.js
│   │   │   ├── committees.js
│   │   │   ├── complaints.js
│   │   │   ├── dashboard.js
│   │   │   ├── index.js
│   │   │   ├── notifications.js
│   │   │   └── payments.js
│   │   ├── agent.js
│   │   ├── authFlow.js
│   │   ├── formatter.js
│   │   ├── index.js
│   │   ├── messageRouter.js
│   │   ├── sessionManager.js
│   │   └── stt.js
│   ├── config/
│   │   ├── db.js
│   │   └── redis.js
│   ├── controller/
│   │   ├── activityController.js
│   │   ├── adminController.js
│   │   ├── assistantController.js
│   │   ├── authController.js
│   │   ├── committeeController.js
│   │   ├── complaintController.js
│   │   ├── dashboardController.js
│   │   ├── notificationController.js
│   │   └── paymentController.js
│   ├── routes/
│   │   ├── activityRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── assistantRoutes.js
│   │   ├── authRoutes.js
│   │   ├── committeeRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── paymentRoutes.js
│   ├── services/
│   │   └── reminderScheduler.js
│   ├── utilities/
│   │   ├── complaintAgent/
│   │   │   ├── index.js
│   │   │   ├── investigator.js
│   │   │   ├── judge.js
│   │   │   ├── queue.js
│   │   │   ├── sweeper.js
│   │   │   └── tools.js
│   │   ├── calendarGenerator.js
│   │   ├── groqLlm.js
│   │   ├── jwt.js
│   │   ├── openrouterLlm.js
│   │   ├── otpService.js
│   │   ├── postgresAuthState.js
│   │   ├── trustScore.js
│   │   └── whatsappGateway.js
│   ├── .envexample
│   └── server.js
├── database/
│   ├── DDL/
│   │   └── sanjhiAI_DDL.sql
│   └── sanjhiAI_database_architecture.webp
├── public/
│   ├── _redirects
│   ├── avatar.svg
│   ├── chatbot-icon.svg
│   ├── logo.png
│   ├── logo.svg
│   ├── manifest.json
│   ├── sanjhi-ai-logo.png
│   ├── sanjhi-logo-white.png
│   ├── sanjhi-logo.png
│   ├── sw.js
│   ├── vite.svg
│   └── whatsapp-icon.svg
├── scripts/
│   └── patch-gradle.mjs
├── src/
│   ├── assets/
│   │   ├── chatbot-icon.svg
│   │   ├── react.svg
│   │   ├── sanjhi-ai-logo.png
│   │   ├── sanjhi-logo-white.png
│   │   ├── sanjhi-logo.png
│   │   ├── screen.png
│   │   └── whatsapp-icon.svg
│   ├── components/
│   │   ├── AddToCalendarModal.jsx
│   │   ├── AdminMobileNav.jsx
│   │   ├── AuthAmbientBackground.jsx
│   │   ├── BottomNav.jsx
│   │   ├── Button.jsx
│   │   ├── CnicVerificationModal.jsx
│   │   ├── CommitteeCard.jsx
│   │   ├── FloatingField.jsx
│   │   ├── Icon.jsx
│   │   ├── MobileSideDrawer.jsx
│   │   ├── PageTransition.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── ReportUserModal.jsx
│   │   ├── ScreenNav.jsx
│   │   └── TopAppBar.jsx
│   ├── context/
│   │   └── NavDrawerContext.jsx
│   ├── data/
│   │   └── countries.js
│   ├── hooks/
│   │   └── useCountUp.js
│   ├── layouts/
│   │   ├── AppLayout.jsx
│   │   └── AuthLayout.jsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── ActivityLog.jsx
│   │   │   ├── AdminAnalytics.jsx
│   │   │   ├── AdminAnnouncements.jsx
│   │   │   ├── AdminCnicVerification.jsx
│   │   │   ├── AdminCommitteeDetail.jsx
│   │   │   ├── AdminCommittees.jsx
│   │   │   ├── AdminDisputes.jsx
│   │   │   ├── AdminOverview.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   └── AdminUsers.jsx
│   │   ├── auth/
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── OTPVerification.jsx
│   │   │   ├── PhoneInput.jsx
│   │   │   ├── ProfileSetup.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── SignUpForm.jsx
│   │   │   └── Welcome.jsx
│   │   ├── committee/
│   │   │   ├── CommitteeCreated.jsx
│   │   │   ├── CommitteeDetail.jsx
│   │   │   ├── CommitteeProgress.jsx
│   │   │   ├── CommitteeSettings.jsx
│   │   │   ├── CommitteeSetup.jsx
│   │   │   ├── CreateCommittee.jsx
│   │   │   ├── JoinByCode.jsx
│   │   │   ├── JoinCommittee.jsx
│   │   │   ├── JoinRequestSent.jsx
│   │   │   ├── LinkAccount.jsx
│   │   │   ├── MyPools.jsx
│   │   │   ├── PublicCommittees.jsx
│   │   │   ├── ReviewConfirm.jsx
│   │   │   └── SetSchedule.jsx
│   │   ├── dashboard/
│   │   │   ├── Assistant.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Notifications.jsx
│   │   ├── members/
│   │   │   ├── InviteMembers.jsx
│   │   │   └── JoinRequests.jsx
│   │   ├── misc/
│   │   │   ├── EmptyStates.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── Offline.jsx
│   │   ├── payments/
│   │   │   ├── MyPayments.jsx
│   │   │   ├── PayNow.jsx
│   │   │   └── ReleasePayout.jsx
│   │   ├── profile/
│   │   │   └── Profile.jsx
│   │   └── support/
│   │       ├── ComplaintDetail.jsx
│   │       ├── FileComplaint.jsx
│   │       ├── MyComplaints.jsx
│   │       └── SupportHome.jsx
│   ├── services/
│   │   ├── adminService.js
│   │   ├── assistantService.js
│   │   ├── authService.js
│   │   ├── committeeService.js
│   │   ├── dashboardService.js
│   │   ├── index.js
│   │   ├── memberService.js
│   │   ├── notificationService.js
│   │   ├── paymentService.js
│   │   └── supportService.js
│   ├── utilities/
│   │   └── calendarHelper.js
│   ├── utils/
│   │   ├── backendUrl.js
│   │   ├── constants.js
│   │   └── wallets.js
│   ├── api.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── capacitor.config.json
├── eslint.config.js
├── index.html
├── instructions.md
├── nodemon.json
├── package-lock.json
├── package.json
├── README.md
├── SANJHI_SRS_ANALYSIS_AND_ARCHITECTURE.md
├── Sanjhi_SRS_v2_0.pdf
└── vite.config.js
```

---

## 📝 Complete File Checklist

### 📂 Root Files (`/`)

- [x] `.env.example` 
- [x] `.gitignore` 
- [x] `README.md` 
- [x] `SANJHI_SRS_ANALYSIS_AND_ARCHITECTURE.md` 
- [x] `Sanjhi_SRS_v2_0.pdf` 
- [x] `capacitor.config.json` 
- [x] `eslint.config.js` 
- [x] `index.html` 
- [x] `instructions.md` 
- [x] `nodemon.json` 
- [x] `package-lock.json` 
- [x] `package.json` 
- [x] `vite.config.js` 

### 📂 `android/`

- [x] `android/.gitignore` 
- [x] `android/build.gradle` 
- [x] `android/capacitor.settings.gradle` 
- [x] `android/gradle.properties` 
- [x] `android/gradlew` 
- [x] `android/gradlew.bat` 
- [x] `android/mailmap.txt` 
- [x] `android/settings.gradle` 
- [x] `android/variables.gradle` 

### 📂 `android/app/`

- [x] `android/app/.gitignore` 
- [x] `android/app/build.gradle` 
- [x] `android/app/capacitor.build.gradle` 
- [x] `android/app/proguard-rules.pro` 

### 📂 `android/app/src/androidTest/java/com/getcapacitor/myapp/`

- [x] `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java` 

### 📂 `android/app/src/main/`

- [x] `android/app/src/main/AndroidManifest.xml` 

### 📂 `android/app/src/main/java/com/sanjhi/app/`

- [x] `android/app/src/main/java/com/sanjhi/app/MainActivity.java` 

### 📂 `android/app/src/main/res/drawable/`

- [x] `android/app/src/main/res/drawable/ic_launcher_background.xml` 
- [x] `android/app/src/main/res/drawable/splash.png` 

### 📂 `android/app/src/main/res/drawable-land-hdpi/`

- [x] `android/app/src/main/res/drawable-land-hdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-land-mdpi/`

- [x] `android/app/src/main/res/drawable-land-mdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-land-xhdpi/`

- [x] `android/app/src/main/res/drawable-land-xhdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-land-xxhdpi/`

- [x] `android/app/src/main/res/drawable-land-xxhdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-land-xxxhdpi/`

- [x] `android/app/src/main/res/drawable-land-xxxhdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-port-hdpi/`

- [x] `android/app/src/main/res/drawable-port-hdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-port-mdpi/`

- [x] `android/app/src/main/res/drawable-port-mdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-port-xhdpi/`

- [x] `android/app/src/main/res/drawable-port-xhdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-port-xxhdpi/`

- [x] `android/app/src/main/res/drawable-port-xxhdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-port-xxxhdpi/`

- [x] `android/app/src/main/res/drawable-port-xxxhdpi/splash.png` 

### 📂 `android/app/src/main/res/drawable-v24/`

- [x] `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` 

### 📂 `android/app/src/main/res/layout/`

- [x] `android/app/src/main/res/layout/activity_main.xml` 

### 📂 `android/app/src/main/res/mipmap-anydpi-v26/`

- [x] `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` 
- [x] `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` 

### 📂 `android/app/src/main/res/mipmap-hdpi/`

- [x] `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` 
- [x] `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png` 
- [x] `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` 

### 📂 `android/app/src/main/res/mipmap-mdpi/`

- [x] `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` 
- [x] `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png` 
- [x] `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` 

### 📂 `android/app/src/main/res/mipmap-xhdpi/`

- [x] `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` 
- [x] `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png` 
- [x] `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` 

### 📂 `android/app/src/main/res/mipmap-xxhdpi/`

- [x] `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` 
- [x] `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png` 
- [x] `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` 

### 📂 `android/app/src/main/res/mipmap-xxxhdpi/`

- [x] `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` 
- [x] `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` 
- [x] `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` 

### 📂 `android/app/src/main/res/values/`

- [x] `android/app/src/main/res/values/ic_launcher_background.xml` 
- [x] `android/app/src/main/res/values/strings.xml` 
- [x] `android/app/src/main/res/values/styles.xml` 

### 📂 `android/app/src/main/res/xml/`

- [x] `android/app/src/main/res/xml/file_paths.xml` 

### 📂 `android/app/src/test/java/com/getcapacitor/myapp/`

- [x] `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java` 

### 📂 `android/gradle/wrapper/`

- [x] `android/gradle/wrapper/gradle-wrapper.jar` 
- [x] `android/gradle/wrapper/gradle-wrapper.properties` 

### 📂 `backend/`

- [X] `backend/.envexample` 
- [X] `backend/server.js` 

### 📂 `backend/assistant/`

- [x] `backend/assistant/retriever.js` 
- [x] `backend/assistant/schema.js` 
- [x] `backend/assistant/seedDocs.js` 

### 📂 `backend/bot/`

- [x] `backend/bot/agent.js` 
- [x] `backend/bot/authFlow.js` 
- [x] `backend/bot/formatter.js` 
- [x] `backend/bot/index.js` 
- [x] `backend/bot/messageRouter.js` 
- [x] `backend/bot/sessionManager.js` 
- [x] `backend/bot/stt.js` 

### 📂 `backend/bot/tools/`

- [x] `backend/bot/tools/calendar.js` 
- [x] `backend/bot/tools/committees.js` 
- [x] `backend/bot/tools/complaints.js` 
- [x] `backend/bot/tools/dashboard.js` 
- [x] `backend/bot/tools/index.js` 
- [x] `backend/bot/tools/notifications.js` 
- [x] `backend/bot/tools/payments.js` 

### 📂 `backend/config/`

- [x] `backend/config/db.js` 
- [x] `backend/config/redis.js` 

### 📂 `backend/controller/`

- [x] `backend/controller/activityController.js` 
- [x] `backend/controller/adminController.js` 
- [x] `backend/controller/assistantController.js` 
- [x] `backend/controller/authController.js` 
- [x] `backend/controller/committeeController.js` 
- [x] `backend/controller/complaintController.js` 
- [x] `backend/controller/dashboardController.js` 
- [x] `backend/controller/notificationController.js` 
- [x] `backend/controller/paymentController.js` 

### 📂 `backend/routes/`

- [x] `backend/routes/activityRoutes.js` 
- [x] `backend/routes/adminRoutes.js` 
- [x] `backend/routes/assistantRoutes.js` 
- [x] `backend/routes/authRoutes.js` 
- [x] `backend/routes/committeeRoutes.js` 
- [x] `backend/routes/complaintRoutes.js` 
- [x] `backend/routes/dashboardRoutes.js` 
- [x] `backend/routes/notificationRoutes.js` 
- [x] `backend/routes/paymentRoutes.js` 

### 📂 `backend/services/`

- [x] `backend/services/reminderScheduler.js` 

### 📂 `backend/utilities/`

- [x] `backend/utilities/calendarGenerator.js` 
- [x] `backend/utilities/groqLlm.js` 
- [x] `backend/utilities/jwt.js` 
- [x] `backend/utilities/openrouterLlm.js` 
- [x] `backend/utilities/otpService.js` 
- [x] `backend/utilities/postgresAuthState.js` 
- [x] `backend/utilities/trustScore.js` 
- [x] `backend/utilities/whatsappGateway.js` 

### 📂 `backend/utilities/complaintAgent/`

- [x] `backend/utilities/complaintAgent/index.js` 
- [x] `backend/utilities/complaintAgent/investigator.js` 
- [x] `backend/utilities/complaintAgent/judge.js` 
- [x] `backend/utilities/complaintAgent/queue.js` 
- [x] `backend/utilities/complaintAgent/sweeper.js` 
- [x] `backend/utilities/complaintAgent/tools.js` 

### 📂 `database/`

- [x] `database/sanjhiAI_database_architecture.webp` 

### 📂 `database/DDL/`

- [x] `database/DDL/sanjhiAI_DDL.sql` 

### 📂 `public/`

- [x] `public/_redirects` 
- [x] `public/avatar.svg` 
- [x] `public/chatbot-icon.svg` 
- [x] `public/logo.png` 
- [x] `public/logo.svg` 
- [x] `public/manifest.json` 
- [x] `public/sanjhi-ai-logo.png` 
- [x] `public/sanjhi-logo-white.png` 
- [x] `public/sanjhi-logo.png` 
- [x] `public/sw.js` 
- [x] `public/vite.svg` 
- [x] `public/whatsapp-icon.svg` 

### 📂 `scripts/`

- [x] `scripts/patch-gradle.mjs` 

### 📂 `src/`

- [ ] `src/App.jsx` 
- [ ] `src/api.js` 
- [ ] `src/index.css` 
- [ ] `src/main.jsx` 

### 📂 `src/assets/`

- [x] `src/assets/chatbot-icon.svg` 
- [x] `src/assets/react.svg` 
- [x] `src/assets/sanjhi-ai-logo.png` 
- [x] `src/assets/sanjhi-logo-white.png` 
- [x] `src/assets/sanjhi-logo.png` 
- [x] `src/assets/screen.png` 
- [x] `src/assets/whatsapp-icon.svg` 

### 📂 `src/components/`

- [x] `src/components/AddToCalendarModal.jsx` 
- [x] `src/components/AdminMobileNav.jsx` 
- [x] `src/components/AuthAmbientBackground.jsx` 
- [x] `src/components/BottomNav.jsx` 
- [x] `src/components/Button.jsx` 
- [x] `src/components/CnicVerificationModal.jsx` 
- [x] `src/components/CommitteeCard.jsx` 
- [x] `src/components/FloatingField.jsx` 
- [x] `src/components/Icon.jsx` 
- [x] `src/components/MobileSideDrawer.jsx` 
- [x] `src/components/PageTransition.jsx` 
- [x] `src/components/ProgressBar.jsx` 
- [x] `src/components/ReportUserModal.jsx` 
- [x] `src/components/ScreenNav.jsx` 
- [x] `src/components/TopAppBar.jsx` 

### 📂 `src/context/`

- [x] `src/context/NavDrawerContext.jsx` 

### 📂 `src/data/`

- [x] `src/data/countries.js` 

### 📂 `src/hooks/`

- [x] `src/hooks/useCountUp.js` 

### 📂 `src/layouts/`

- [x] `src/layouts/AppLayout.jsx` 
- [x] `src/layouts/AuthLayout.jsx` 

### 📂 `src/pages/admin/`

- [x] `src/pages/admin/ActivityLog.jsx` 
- [x] `src/pages/admin/AdminAnalytics.jsx` 
- [x] `src/pages/admin/AdminAnnouncements.jsx` 
- [x] `src/pages/admin/AdminCnicVerification.jsx` 
- [x] `src/pages/admin/AdminCommitteeDetail.jsx` 
- [x] `src/pages/admin/AdminCommittees.jsx` 
- [x] `src/pages/admin/AdminDisputes.jsx` 
- [x] `src/pages/admin/AdminOverview.jsx` 
- [x] `src/pages/admin/AdminSettings.jsx` 
- [x] `src/pages/admin/AdminUsers.jsx` 

### 📂 `src/pages/auth/`

- [x] `src/pages/auth/ForgotPassword.jsx` 
- [x] `src/pages/auth/LoginForm.jsx` 
- [x] `src/pages/auth/OTPVerification.jsx` 
- [x] `src/pages/auth/PhoneInput.jsx` 
- [x] `src/pages/auth/ProfileSetup.jsx` 
- [x] `src/pages/auth/ResetPassword.jsx` 
- [x] `src/pages/auth/SignUp.jsx` 
- [x] `src/pages/auth/SignUpForm.jsx` 
- [x] `src/pages/auth/Welcome.jsx` 

### 📂 `src/pages/committee/`

- [x] `src/pages/committee/CommitteeCreated.jsx` 
- [x] `src/pages/committee/CommitteeDetail.jsx` 
- [x] `src/pages/committee/CommitteeProgress.jsx` 
- [x] `src/pages/committee/CommitteeSettings.jsx` 
- [x] `src/pages/committee/CommitteeSetup.jsx` 
- [x] `src/pages/committee/CreateCommittee.jsx` 
- [x] `src/pages/committee/JoinByCode.jsx` 
- [x] `src/pages/committee/JoinCommittee.jsx` 
- [x] `src/pages/committee/JoinRequestSent.jsx` 
- [x] `src/pages/committee/LinkAccount.jsx` 
- [x] `src/pages/committee/MyPools.jsx` 
- [x] `src/pages/committee/PublicCommittees.jsx` 
- [x] `src/pages/committee/ReviewConfirm.jsx` 
- [x] `src/pages/committee/SetSchedule.jsx` 

### 📂 `src/pages/dashboard/`

- [x] `src/pages/dashboard/Assistant.jsx` 
- [x] `src/pages/dashboard/Dashboard.jsx` 
- [x] `src/pages/dashboard/Notifications.jsx` 

### 📂 `src/pages/members/`

- [x] `src/pages/members/InviteMembers.jsx` 
- [x] `src/pages/members/JoinRequests.jsx` 

### 📂 `src/pages/misc/`

- [x] `src/pages/misc/EmptyStates.jsx` 
- [x] `src/pages/misc/Loading.jsx` 
- [x] `src/pages/misc/Offline.jsx` 

### 📂 `src/pages/payments/`

- [x] `src/pages/payments/MyPayments.jsx` 
- [x] `src/pages/payments/PayNow.jsx` 
- [x] `src/pages/payments/ReleasePayout.jsx` 

### 📂 `src/pages/profile/`

- [x] `src/pages/profile/Profile.jsx` 

### 📂 `src/pages/support/`

- [x] `src/pages/support/ComplaintDetail.jsx` 
- [x] `src/pages/support/FileComplaint.jsx` 
- [x] `src/pages/support/MyComplaints.jsx` 
- [x] `src/pages/support/SupportHome.jsx` 

### 📂 `src/services/`

- [ ] `src/services/adminService.js` 
- [ ] `src/services/assistantService.js` 
- [ ] `src/services/authService.js` 
- [ ] `src/services/committeeService.js` 
- [ ] `src/services/dashboardService.js` 
- [ ] `src/services/index.js` 
- [ ] `src/services/memberService.js` 
- [ ] `src/services/notificationService.js` 
- [ ] `src/services/paymentService.js` 
- [ ] `src/services/supportService.js` 

### 📂 `src/utilities/`

- [ ] `src/utilities/calendarHelper.js` 

### 📂 `src/utils/`

- [ ] `src/utils/backendUrl.js` 
- [ ] `src/utils/constants.js` 
- [ ] `src/utils/wallets.js` 

