# 🏛️ Sanjhi (سانجھی) — SRS Gap Analysis & Complete System Architecture

> **Document Version:** 2.0  
> **Status:** Comprehensive Technical Design & Requirements Audit  
> **Target Platform:** Web (React 19 / PWA), Native Mobile (Capacitor Android APK), WhatsApp Conversational AI (Baileys)

---

## 📑 Table of Contents
1. [Executive Summary & SRS Alignment Overview](#1-executive-summary--srs-alignment-overview)
2. [SRS Feature Comparison & Gap Matrix](#2-srs-feature-comparison--gap-matrix)
3. [Features Implemented Beyond Original SRS Specifications](#3-features-implemented-beyond-original-srs-specifications)
4. [Missing / Future Scope Features](#4-missing--future-scope-features)
5. [Comprehensive System Architecture Diagrams](#5-comprehensive-system-architecture-diagrams)
   * [5.1 High-Level C4 System Context Diagram](#51-high-level-c4-system-context-diagram)
   * [5.2 Layered Modular Software Architecture](#52-layered-modular-software-architecture)
   * [5.3 Database Entity-Relationship Diagram (ERD)](#53-database-entity-relationship-diagram-erd)
   * [5.4 Autonomous Multi-Agent AI Dispute Resolution Court](#54-autonomous-multi-agent-ai-dispute-resolution-court)
   * [5.5 Multilingual WhatsApp Voice & Text Processing Pipeline](#55-multilingual-whatsapp-voice--text-processing-pipeline)
   * [5.6 Mathematical Trust Scoring (0–1000) State Machine](#56-mathematical-trust-scoring-01000-state-machine)
   * [5.7 Financial Cycle & Turn Payout State Transition](#57-financial-cycle--turn-payout-state-transition)
   * [5.8 Zero-Latency Mobile Storage & Service Worker Cache Engine](#58-zero-latency-mobile-storage--service-worker-cache-engine)

---

## 1. Executive Summary & SRS Alignment Overview

The original **Software Requirements Specification (SRS)** established the functional baseline for digitizing traditional South Asian Rotating Savings and Credit Associations (**ROSCAs** / **Kameti / کمیٹی**). 

While the initial SRS focused primarily on basic CRUD committee creation, manual payment tracking, and static roles, the **actual production implementation of Sanjhi** has evolved into a resilient financial platform featuring:
* **Multi-Agent Autonomous AI Dispute Triage** (Investigator Agent + Judge Agent with zero-hallucination tools).
* **Bilingual WhatsApp Voice Note Processing** in Roman Urdu and Urdu script using Groq Whisper Large v3 and LLaMA 3.3 70B.
* **Dual Pakistani Mobile Wallet Deep-Linking** (JazzCash and EasyPaisa).
* **0ms Zero-Latency Offline-First Caching Architecture** (PWA Service Worker + Capacitor Native Android APK).

---

## 2. SRS Feature Comparison & Gap Matrix

| Functional Module | Baseline SRS Requirement | Actual Implemented State | SRS Gap / Extension Status |
| :--- | :--- | :--- | :--- |
| **Authentication (FR-AUTH)** | OTP-only mobile login | Dual phone/email auth + 6-digit BCrypt hashed OTP + Contact linking | **Exceeds SRS** (Supports secondary email/phone additions with 2-step verification) |
| **Identity Verification** | Mentioned CNIC capture | Two-sided NADRA-compliant CNIC upload + Admin approval modal + Rejection feedback | **Fully Implemented** |
| **Committee Management (FR-COMM)** | Manual committee setup form | Natural Language text & voice parsing + Instant invite codes + Public/Private marketplace toggle | **Exceeds SRS** (AI extracts schedule, turns, and dues directly from spoken voice notes) |
| **Financial Ledger (FR-PAY)** | Text ledger tracking | Double-entry cycle reconciliation + Turn tracking + Receipt proof uploads | **Fully Implemented** |
| **Quick Payments** | Generic bank transfer note | Dual JazzCash (`com.techlogix.mobilinkcustomer`) & EasyPaisa (`pk.com.telenor.phoenix`) deep-linking with auto clipboard copy | **Feature Added Beyond SRS** |
| **Trust Scoring** | Static reputation rating | Dynamic 0–1000 mathematical formula computed live over PostgreSQL ledger history | **Feature Added Beyond SRS** |
| **Dispute Resolution (FR-DISP)** | Manual admin support inbox | Autonomous 2-Agent Court (Investigator + Judge) + Auto-verdict + Human escalation queue | **Feature Added Beyond SRS** |
| **AI Assistant (FR-AI)** | Basic FAQ chatbot | Multilingual conversational voice & text assistant on Web & WhatsApp via Baileys | **Exceeds SRS** |
| **Client Platforms** | Web responsive | Hybrid: Next-gen React 19 PWA + 0ms Flash-bundled native Android APK via Capacitor 8 | **Exceeds SRS** |

---

## 3. Features Implemented Beyond Original SRS Specifications

### 1. Autonomous AI Dispute Resolution Court
* **SRS Limitation:** Original SRS only specified a simple complaint form where users submit tickets for human review.
* **Production Implementation:** Built an autonomous multi-agent dispute system:
  * **Investigator Agent:** Uses read-only database tools to inspect ledger timestamps, payment proofs, member histories, and CNIC statuses.
  * **Judge Agent:** Evaluates findings against predefined bylaws and issues legally grounded verdicts with confidence scores. High-confidence issues are resolved in real-time, while complex issues are escalated to Super Admins.

### 2. WhatsApp Conversational Urdu Voice Engine
* **SRS Limitation:** Original SRS did not specify voice interactions or WhatsApp integration.
* **Production Implementation:** Integrated `@whiskeysockets/baileys` with `fluent-ffmpeg` and `groq-sdk`:
  * Transcribes WhatsApp voice notes (`.ogg`/`.opus`) using **Groq Whisper Large v3**.
  * Understands Roman Urdu (e.g., *"Meri agli kameti kab hai?"*), Nastaliq Urdu script, and English.
  * Executes transactions, checks balances, and generates ICS calendar schedules directly in chat.

### 3. Mathematical Trust Score Model (0–1000)
* **SRS Limitation:** SRS briefly mentioned a 5-star or badge system without mathematical definition.
* **Production Implementation:** Implemented a transparent, deterministic algorithm:
  $$\text{Trust Score} = \text{Base Points (500)} + \text{Reliability Points} + \text{Completion Bonus} + \text{CNIC Bonus} - \text{Default/Penalty Points}$$
  * Automatically assigns tiers: **Diamond (900–1000)**, **Gold (750–899)**, **Silver (600–749)**, and **Bronze (<600)**.

### 4. 0ms Zero-Latency Offline-First Architecture
* **SRS Limitation:** Assumed constant high-speed internet connectivity.
* **Production Implementation:** Added a custom **Service Worker (`public/sw.js`)** and Capacitor asset bundling so all UI vector icons, styles, fonts, and scripts are stored in the phone's physical flash storage.

---

## 4. Missing / Future Scope Features (Omitted in Baseline SRS)

The following high-value enterprise features were omitted from the baseline SRS and represent the next development roadmap:

```mermaid
mindmap
  root((Future Roadmap Gaps))
    Financial Infrastructure
      Direct 1-Link Banking Switch Integration
      Automated In-App Escrow Wallets
      Split Payouts & Micro-loans
    Mechanism Design
      Auction / Bidding Turn Ordering
      Lottery / Blind Lucky-Draw Turn Shuffling
      Flexible Emergency Turn Swapping
    Legal & Compliance
      SECP Digital Lending Compliance
      Digital e-Signatures for P2P Promissory Notes
      NADRA Verisys Live API Biometric Verification
    Cross-Border Remittances
      Overseas Pakistani Rosca Corridors (GCC / UK)
      Multi-currency Real-Time Exchange (AED/SAR/PKR)
```

---

## 5. Comprehensive System Architecture Diagrams

### 5.1 High-Level C4 System Context Diagram

```mermaid
C4Context
    title System Context Diagram for Sanjhi Community Savings Platform

    Person(user, "Committee Participant", "Saves money, pays monthly dues, and receives turn payouts.")
    Person(organizer, "Committee Organizer", "Creates pools, invites friends, and verifies payment receipts.")
    Person(admin, "Super Admin", "Oversees circulating volume, triages escalated disputes, verifies CNICs.")

    System(sanjhi, "Sanjhi Platform", "Core backend and web/mobile application orchestrating ROSCA pools, ledger, and trust scores.")

    System_Ext(whatsapp, "WhatsApp Cloud", "Delivers voice notes, reminders, and interactive conversational bot.")
    System_Ext(groq, "Groq AI Cloud", "High-speed LLaMA 3.3 70B LLM inference and Whisper Large v3 voice transcription.")
    System_Ext(wallets, "JazzCash & EasyPaisa", "External mobile wallet apps for peer-to-peer funds transfer.")
    System_Ext(smtp, "SMTP Mail Gateway", "Dispatches email OTP verification codes and transactional receipts.")

    Rel(user, sanjhi, "Accesses via Android APK / Web Browser", "HTTPS / WSS")
    Rel(user, whatsapp, "Sends Urdu Voice & Text messages", "WhatsApp Socket")
    Rel(organizer, sanjhi, "Manages committee schedules & approves members", "HTTPS")
    Rel(admin, sanjhi, "Monitors platform audit logs & verifies CNICs", "HTTPS")

    Rel(sanjhi, whatsapp, "Bi-directional messaging & turn reminders", "Baileys WebSocket")
    Rel(sanjhi, groq, "LLM parsing, multi-agent judge, and audio transcription", "REST API")
    Rel(sanjhi, wallets, "Deep-links transactions with account copy", "Intent / URI Schemes")
    Rel(sanjhi, smtp, "Sends authentication OTPs", "TLS / Port 587")
```

---

### 5.2 Layered Modular Software Architecture

```mermaid
graph TD
    subgraph PresentationLayer["Presentation Layer (Client Side)"]
        A1[React 19 Vite SPA]
        A2[Capacitor 8 Android Native Bridge]
        A3[PWA Service Worker Cache Storage API]
        A4[Zero-Network SVG Vector Icon Engine]
    end

    subgraph APIGateway["API & Network Layer"]
        B1[Express 4.19 REST API Server]
        B2[JWT Authentication Middleware]
        B3[Rate Limiter & Input Sanitizers]
        B4[Multer Multipart Storage Engine]
    end

    subgraph DomainServices["Core Business Logic & Autonomous Agents"]
        C1[Committee & Cycle Scheduling Service]
        C2[PostgreSQL Double-Entry Ledger Service]
        C3[Mathematical Trust Score Engine]
        C4[Multi-Agent Dispute Resolution Court]
        C5[Baileys WhatsApp Conversational Agent]
    end

    subgraph DataStorageLayer["Data & Persistence Layer"]
        D1[(PostgreSQL Relational Ledger)]
        D2[File Storage: /uploads/avatars & /uploads/cnic]
        D3[Baileys Auth Credential Store]
    end

    A1 --> B1
    A2 --> A1
    A3 --> A1
    B1 --> B2 --> C1
    B1 --> C2
    B1 --> C3
    B1 --> C4
    B1 --> C5
    C1 --> D1
    C2 --> D1
    C3 --> D1
    C4 --> D1
    C5 --> D1
    B4 --> D2
    C5 --> D3
```

---

### 5.3 Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ OTPS : receives
    USERS ||--o{ COMMITTEES : creates
    USERS ||--o{ MEMBERS : participates_in
    USERS ||--o{ PAYMENTS : submits
    USERS ||--o{ COMPLAINTS : files
    USERS ||--o{ TRUST_SCORE_LOGS : accrues
    USERS ||--o{ NOTIFICATIONS : receives

    COMMITTEES ||--|{ CYCLES : contains
    COMMITTEES ||--|{ MEMBERS : enrolls
    COMMITTEES ||--o{ COMPLAINTS : pertains_to

    CYCLES ||--|{ PAYMENTS : collects
    CYCLES ||--o| USERS : recipient_user

    USERS {
        uuid id PK
        string full_name
        string phone_number UK
        string email UK
        string password_hash
        string cnic_number
        string cnic_status
        boolean is_suspended
        timestamptz created_at
    }

    COMMITTEES {
        uuid id PK
        uuid created_by FK
        string name
        numeric contribution_amount
        int capacity
        string interval_type
        string status
        boolean is_public
        string invite_code UK
    }

    CYCLES {
        uuid id PK
        uuid committee_id FK
        int cycle_number
        uuid recipient_user_id FK
        string payout_status
        timestamptz due_date
        timestamptz payout_sent_at
    }

    PAYMENTS {
        uuid id PK
        uuid cycle_id FK
        uuid user_id FK
        numeric amount
        string status
        string proof_image_url
        timestamptz submitted_at
        timestamptz verified_at
    }

    MEMBERS {
        uuid id PK
        uuid committee_id FK
        uuid user_id FK
        int assigned_turn
        string status
        timestamptz joined_at
    }

    COMPLAINTS {
        uuid id PK
        uuid committee_id FK
        uuid complainant_id FK
        uuid target_user_id FK
        string category
        string status
        string priority
        text resolution_notes
    }

    TRUST_SCORE_LOGS {
        uuid id PK
        uuid user_id FK
        int points_delta
        string reason
        timestamptz created_at
    }
```

---

### 5.4 Autonomous Multi-Agent AI Dispute Resolution Court

```mermaid
sequenceDiagram
    autonumber
    actor Complainant as Participant
    participant API as Dispute Controller
    participant Queue as AI Triage Queue
    participant Investigator as AI Investigator Agent
    participant Judge as AI Judge Agent
    participant DB as PostgreSQL Ledger
    actor Admin as Super Admin

    Complainant->>API: Submit Dispute (e.g., "Organizer marked me overdue but JazzCash paid")
    API->>DB: Insert Complaint (Status: 'pending')
    API->>Queue: Enqueue Complaint for AI Triage

    Queue->>Investigator: Assign Investigation Task
    Investigator->>DB: Tool Call: inspect_ledger_payments(user_id, cycle_id)
    Investigator->>DB: Tool Call: inspect_cnic_and_trust_history(target_id)
    Investigator-->>Judge: Structured Audit Findings (Evidence Dossier)

    Judge->>Judge: Evaluate Sanjhi Bylaws & Ledger Evidence
    alt High Confidence (>85% Certainty)
        Judge->>DB: Update Complaint (Status: 'ai_resolved', Verdict: 'Payment Verified')
        Judge->>DB: Adjust Trust Score & Clear Penalty
        Judge->>API: Dispatch WhatsApp/Push Notification to both parties
    else Low Confidence / Complex Fraud Allegation
        Judge->>DB: Update Complaint (Status: 'needs_human_review', Priority: 'urgent')
        Judge->>Admin: Escalate to Super Admin Dashboard with AI Brief
        Admin->>DB: Manual Override & Final Resolution
    end
```

---

### 5.5 Multilingual WhatsApp Voice & Text Processing Pipeline

```mermaid
flowchart LR
    A[WhatsApp Voice Note .ogg/.opus] --> B[Baileys Socket Gateway]
    B --> C[Fluent-FFmpeg Converter]
    C -->|Converted .wav 16kHz| D[Groq Whisper Large v3]
    D -->|Urdu / Roman Urdu Transcript| E[Language & Intent Classifier]
    
    subgraph IntentEngine["Agentic Tool Router"]
        E --> F{User Intent}
        F -->|Check Dues| G[get_user_dues_tool]
        F -->|Turn Schedule| H[get_turn_schedule_tool]
        F -->|Submit Payment| I[submit_payment_proof_tool]
        F -->|Create Pool| J[parse_committee_voice_tool]
    end

    G --> K[PostgreSQL Ledger]
    H --> K
    I --> K
    J --> K

    K --> L[Groq LLaMA 3.3 70B Formatter]
    L -->|Conversational Urdu/English Response| M[WhatsApp Delivery Message]
```

---

### 5.6 Mathematical Trust Scoring (0–1000) State Machine

```mermaid
stateDiagram-v2
    [*] --> UnverifiedAccount: User Signs Up (Initial Base = 500)
    
    UnverifiedAccount --> VerifiedAccount: CNIC Verified (+100 Points)
    
    VerifiedAccount --> BuildingTrust: First Committee Joined
    
    state BuildingTrust {
        [*] --> SilverTier: Score 600 - 749
        SilverTier --> GoldTier: Consistent On-time Payments (+15 pts/cycle) Score 750 - 899
        GoldTier --> DiamondTier: 100% Reliability & 3+ Completed Pools Score 900 - 1000
    }
    
    BuildingTrust --> HighRisk: Overdue Payment / Late Submission (-40 Points)
    HighRisk --> DefaultSuspended: Defaulting Turn / Fraud Finding (-300 Points -> Score < 400)
    
    DefaultSuspended --> SuspendedState: Auto-Freeze from Public Marketplace
    
    HighRisk --> GoldTier: 3 Consecutive On-Time Cycles (Gradual Score Restoration)
```

---

### 5.7 Financial Cycle & Turn Payout State Transition

```mermaid
stateDiagram-v2
    [*] --> Collecting: Cycle Initiated on Due Date
    
    state Collecting {
        [*] --> PendingPayments
        PendingPayments --> AwaitingConfirmation: Participant Uploads JazzCash/EasyPaisa Proof
        AwaitingConfirmation --> PaymentVerified: Organizer Verifies Ledger
        PendingPayments --> OverdueFlagged: Grace Period Passes Without Payment
    }

    Collecting --> PoolReadyForPayout: All Member Dues Confirmed
    
    state PoolReadyForPayout {
        [*] --> TurnRecipientNotified
        TurnRecipientNotified --> PayoutTransferred: Organizer Dispatches Lump Sum
        PayoutTransferred --> PayoutConfirmedByMember: Recipient Acknowledges Funds
    }

    PoolReadyForPayout --> CycleClosed: Payout Completed & Ledger Locked
    CycleClosed --> [*]: Next Cycle Advances Automatically
```

---

### 5.8 Zero-Latency Mobile Storage & Service Worker Cache Engine

```mermaid
flowchart TD
    Client[Mobile App / Browser Client] --> SW{Service Worker Registered?}
    
    SW -->|Yes| FetchHandler[Fetch Event Interceptor]
    SW -->|No| NetworkDirect[Direct Network Fetch]

    FetchHandler --> URLCheck{Request URL Type}
    
    URLCheck -->|Static Assets JS, CSS, PNG, Fonts| CacheFirst[Cache-First Strategy]
    CacheFirst --> CacheLookup{Found in Cache?}
    CacheLookup -->|Hit 0ms| ServeCache[Serve Directly from Device Flash Memory]
    CacheLookup -->|Miss| FetchNetwork[Fetch from Network & Save to sanjhi-assets-v1]
    
    URLCheck -->|Live REST API /api/...| NetworkFirst[Network-First Strategy]
    NetworkFirst --> LiveBackend[Query Node.js Railway Backend]
    LiveBackend -->|Success| ReturnLive[Return Live Ledger Data & Update LocalStorage]
    LiveBackend -->|Offline/Failure| StaleCacheFallback[Serve Cached LocalStorage Stale Data]

    subgraph NativeAPK["Capacitor Native APK"]
        NativeFiles[android/app/src/main/assets/public/] --> LocalWebView[WebView served from https://localhost/ at 0ms]
    end
```

---

## 6. Summary of Key Takeaways

1. **Production-Ready Beyond Specification:** Sanjhi's current codebase does not just implement the original SRS; it modernizes the entire concept of ROSCAs with autonomous AI agents, WhatsApp voice intelligence, and native mobile wallet interoperability.
2. **Deterministic Ledger Security:** Financial trust is established through strict double-entry ledger bookkeeping, tamper-evident audit logs, and automatic trust score adjustment.
3. **Resilient Offline Performance:** With dual PWA caching and Capacitor native binary bundling, the app loads with 0ms delay regardless of cellular coverage.
