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
- **Status**: 70 / 230 Copied
- **Progress**: `[██████░░░░░░░░░░░░░░] 30%` 

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

- [ ] `.env.example` 
- [ ] `.gitignore` 
- [x] `README.md` 
- [ ] `SANJHI_SRS_ANALYSIS_AND_ARCHITECTURE.md` 
- [ ] `Sanjhi_SRS_v2_0.pdf` 
- [ ] `capacitor.config.json` 
- [ ] `eslint.config.js` 
- [ ] `index.html` 
- [ ] `instructions.md` 
- [ ] `nodemon.json` 
- [ ] `package-lock.json` 
- [ ] `package.json` 
- [ ] `vite.config.js` 

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

- [ ] `backend/.envexample` 
- [ ] `backend/server.js` 

### 📂 `backend/assistant/`

- [ ] `backend/assistant/retriever.js` 
- [ ] `backend/assistant/schema.js` 
- [ ] `backend/assistant/seedDocs.js` 

### 📂 `backend/bot/`

- [ ] `backend/bot/agent.js` 
- [ ] `backend/bot/authFlow.js` 
- [ ] `backend/bot/formatter.js` 
- [ ] `backend/bot/index.js` 
- [ ] `backend/bot/messageRouter.js` 
- [ ] `backend/bot/sessionManager.js` 
- [ ] `backend/bot/stt.js` 

### 📂 `backend/bot/tools/`

- [ ] `backend/bot/tools/calendar.js` 
- [ ] `backend/bot/tools/committees.js` 
- [ ] `backend/bot/tools/complaints.js` 
- [ ] `backend/bot/tools/dashboard.js` 
- [ ] `backend/bot/tools/index.js` 
- [ ] `backend/bot/tools/notifications.js` 
- [ ] `backend/bot/tools/payments.js` 

### 📂 `backend/config/`

- [ ] `backend/config/db.js` 
- [ ] `backend/config/redis.js` 

### 📂 `backend/controller/`

- [ ] `backend/controller/activityController.js` 
- [ ] `backend/controller/adminController.js` 
- [ ] `backend/controller/assistantController.js` 
- [ ] `backend/controller/authController.js` 
- [ ] `backend/controller/committeeController.js` 
- [ ] `backend/controller/complaintController.js` 
- [ ] `backend/controller/dashboardController.js` 
- [ ] `backend/controller/notificationController.js` 
- [ ] `backend/controller/paymentController.js` 

### 📂 `backend/routes/`

- [ ] `backend/routes/activityRoutes.js` 
- [ ] `backend/routes/adminRoutes.js` 
- [ ] `backend/routes/assistantRoutes.js` 
- [ ] `backend/routes/authRoutes.js` 
- [ ] `backend/routes/committeeRoutes.js` 
- [ ] `backend/routes/complaintRoutes.js` 
- [ ] `backend/routes/dashboardRoutes.js` 
- [ ] `backend/routes/notificationRoutes.js` 
- [ ] `backend/routes/paymentRoutes.js` 

### 📂 `backend/services/`

- [ ] `backend/services/reminderScheduler.js` 

### 📂 `backend/utilities/`

- [ ] `backend/utilities/calendarGenerator.js` 
- [ ] `backend/utilities/groqLlm.js` 
- [ ] `backend/utilities/jwt.js` 
- [ ] `backend/utilities/openrouterLlm.js` 
- [ ] `backend/utilities/otpService.js` 
- [ ] `backend/utilities/postgresAuthState.js` 
- [ ] `backend/utilities/trustScore.js` 
- [ ] `backend/utilities/whatsappGateway.js` 

### 📂 `backend/utilities/complaintAgent/`

- [ ] `backend/utilities/complaintAgent/index.js` 
- [ ] `backend/utilities/complaintAgent/investigator.js` 
- [ ] `backend/utilities/complaintAgent/judge.js` 
- [ ] `backend/utilities/complaintAgent/queue.js` 
- [ ] `backend/utilities/complaintAgent/sweeper.js` 
- [ ] `backend/utilities/complaintAgent/tools.js` 

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

- [ ] `src/assets/chatbot-icon.svg` 
- [ ] `src/assets/react.svg` 
- [ ] `src/assets/sanjhi-ai-logo.png` 
- [ ] `src/assets/sanjhi-logo-white.png` 
- [ ] `src/assets/sanjhi-logo.png` 
- [ ] `src/assets/screen.png` 
- [ ] `src/assets/whatsapp-icon.svg` 

### 📂 `src/components/`

- [ ] `src/components/AddToCalendarModal.jsx` 
- [ ] `src/components/AdminMobileNav.jsx` 
- [ ] `src/components/AuthAmbientBackground.jsx` 
- [ ] `src/components/BottomNav.jsx` 
- [ ] `src/components/Button.jsx` 
- [ ] `src/components/CnicVerificationModal.jsx` 
- [ ] `src/components/CommitteeCard.jsx` 
- [ ] `src/components/FloatingField.jsx` 
- [ ] `src/components/Icon.jsx` 
- [ ] `src/components/MobileSideDrawer.jsx` 
- [ ] `src/components/PageTransition.jsx` 
- [ ] `src/components/ProgressBar.jsx` 
- [ ] `src/components/ReportUserModal.jsx` 
- [ ] `src/components/ScreenNav.jsx` 
- [ ] `src/components/TopAppBar.jsx` 

### 📂 `src/context/`

- [ ] `src/context/NavDrawerContext.jsx` 

### 📂 `src/data/`

- [ ] `src/data/countries.js` 

### 📂 `src/hooks/`

- [ ] `src/hooks/useCountUp.js` 

### 📂 `src/layouts/`

- [ ] `src/layouts/AppLayout.jsx` 
- [ ] `src/layouts/AuthLayout.jsx` 

### 📂 `src/pages/admin/`

- [ ] `src/pages/admin/ActivityLog.jsx` 
- [ ] `src/pages/admin/AdminAnalytics.jsx` 
- [ ] `src/pages/admin/AdminAnnouncements.jsx` 
- [ ] `src/pages/admin/AdminCnicVerification.jsx` 
- [ ] `src/pages/admin/AdminCommitteeDetail.jsx` 
- [ ] `src/pages/admin/AdminCommittees.jsx` 
- [ ] `src/pages/admin/AdminDisputes.jsx` 
- [ ] `src/pages/admin/AdminOverview.jsx` 
- [ ] `src/pages/admin/AdminSettings.jsx` 
- [ ] `src/pages/admin/AdminUsers.jsx` 

### 📂 `src/pages/auth/`

- [ ] `src/pages/auth/ForgotPassword.jsx` 
- [ ] `src/pages/auth/LoginForm.jsx` 
- [ ] `src/pages/auth/OTPVerification.jsx` 
- [ ] `src/pages/auth/PhoneInput.jsx` 
- [ ] `src/pages/auth/ProfileSetup.jsx` 
- [ ] `src/pages/auth/ResetPassword.jsx` 
- [ ] `src/pages/auth/SignUp.jsx` 
- [ ] `src/pages/auth/SignUpForm.jsx` 
- [ ] `src/pages/auth/Welcome.jsx` 

### 📂 `src/pages/committee/`

- [ ] `src/pages/committee/CommitteeCreated.jsx` 
- [ ] `src/pages/committee/CommitteeDetail.jsx` 
- [ ] `src/pages/committee/CommitteeProgress.jsx` 
- [ ] `src/pages/committee/CommitteeSettings.jsx` 
- [ ] `src/pages/committee/CommitteeSetup.jsx` 
- [ ] `src/pages/committee/CreateCommittee.jsx` 
- [ ] `src/pages/committee/JoinByCode.jsx` 
- [ ] `src/pages/committee/JoinCommittee.jsx` 
- [ ] `src/pages/committee/JoinRequestSent.jsx` 
- [ ] `src/pages/committee/LinkAccount.jsx` 
- [ ] `src/pages/committee/MyPools.jsx` 
- [ ] `src/pages/committee/PublicCommittees.jsx` 
- [ ] `src/pages/committee/ReviewConfirm.jsx` 
- [ ] `src/pages/committee/SetSchedule.jsx` 

### 📂 `src/pages/dashboard/`

- [ ] `src/pages/dashboard/Assistant.jsx` 
- [ ] `src/pages/dashboard/Dashboard.jsx` 
- [ ] `src/pages/dashboard/Notifications.jsx` 

### 📂 `src/pages/members/`

- [ ] `src/pages/members/InviteMembers.jsx` 
- [ ] `src/pages/members/JoinRequests.jsx` 

### 📂 `src/pages/misc/`

- [ ] `src/pages/misc/EmptyStates.jsx` 
- [ ] `src/pages/misc/Loading.jsx` 
- [ ] `src/pages/misc/Offline.jsx` 

### 📂 `src/pages/payments/`

- [ ] `src/pages/payments/MyPayments.jsx` 
- [ ] `src/pages/payments/PayNow.jsx` 
- [ ] `src/pages/payments/ReleasePayout.jsx` 

### 📂 `src/pages/profile/`

- [ ] `src/pages/profile/Profile.jsx` 

### 📂 `src/pages/support/`

- [ ] `src/pages/support/ComplaintDetail.jsx` 
- [ ] `src/pages/support/FileComplaint.jsx` 
- [ ] `src/pages/support/MyComplaints.jsx` 
- [ ] `src/pages/support/SupportHome.jsx` 

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

