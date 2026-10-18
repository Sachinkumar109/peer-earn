# Peer-Earn 🎓🪙
> **Decentralized Peer-to-Peer Academic Doubt-Solving & Learning Economy Platform**
> *"Quora meets Duolingo for schools" — students learn by asking, and earn by helping.*

& Authentication).Built for College project(24–36 hour window) using React (Vite) + Firebase (Cloud Firestore 

---

## 🌟 Features Overview

- **Student Authentication**:
  - Sign up with Name, School/College Email, Academic Class/Level (`10th`, `11th`, `12th`, `College` `PG`).
  - Automatic starting grant of **100 Knowledge Points (KP)**.
  - Seamless login with email & password or 1-click test student selector.

- **Post Doubts & Stake KP**:
  - Students post questions categorized by subject (*Mathematics, Physics, Chemistry, Biology, Computer Science, All subjects, English*) and class level.
  - Stake Knowledge Points (held in escrow) to incentivize peers to provide quality solutions.

- **Real-Time Doubt Feed & Filtering**:
  - Browse and search open bounties.
  - Filter by Subject, Class Level, and Status (*Open Bounties, In Discussion, Resolved*).

- **1-to-1 Real-Time Solving Room**:
  - Instant live messaging powered by Firestore subcollections (`doubts/{id}/messages`) with real-time `onSnapshot` listeners.
  - Helper peers claim doubts in progress.

- **Knowledge Points Transfer Transaction**:
  - When the asker is satisfied with the explanation, they click **"Mark as Resolved"**.
  - Executes an atomic transaction:
    - Transfers staked KP + **5 KP platform bonus** to the solver.
    - Increments the solver's `totalSolved` and `reputation`.
    - Increments the asker's `totalAccepted` and `reputation`.
    - Updates doubt status to `resolved`.

- **Student Profile & Campus Rewards Store (Mockup)**:
  - Track wallet KP balance, reputation score, and doubt activity history (Doubts Asked vs Doubts Solved).
  - Preview future token utility: Redeem earned KP for campus cafeteria meal vouchers, bookstore discounts, and verified peer tutor certificates.

- **Dual Mode (Hackathon Demo Resilience)**:
  - **Live Firebase Mode**: Connect your Firebase project credentials in `.env` to use live Cloud Firestore & Firebase Auth.
  - **Local Sandbox / Demo Mode**: Automatically active if `.env` is omitted. Includes pre-seeded students (*Aarav*, *Priya*, *Rohan*), pre-seeded doubts, and real-time **multi-tab sync** via `BroadcastChannel` so judges can test live interactions across two browser windows immediately!

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## ⚙️ Connecting Live Firebase (Optional)

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password provider).
3. Enable **Cloud Firestore** (start in Test Mode or apply the security rules below).
4. Copy `.env` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Fill in your Firebase web app configuration:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:...
   ```
6. Restart the dev server (`npm run dev`). The top banner will reflect `Firebase Live Mode Active`.

---

## 🔒 Firestore Security Rules (`firestore.rules`)

Apply the following security rules in Firebase Console -> Firestore -> Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /doubts/{doubtId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;

      match /messages/{messageId} {
        allow read, create: if request.auth != null;
      }
    }
  }
}
```

---

## 📦 Deployment to firebase

1. Push this repository to GitHub or GitLab.
2. Go to [firebase Dashboard](https://web.app/) and click **Add New Project**.
3. Import this repository.
4. Framework Preset: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. (Optional) Add your Firebase environment variables under **Environment Variables**.
8. Click **Deploy**.

---

## 🧪 Live Demo Flow for Judges (2-Tab Walkthrough)

1. **Tab 1 (Student A - Aryan)**:
   - Logged in as Aarav (12th Grade).
   - Click **"Post a Doubt & Stake KP"**.
   - Select Subject: *Physics*, Class: *12th*, Stake: *25 KP*.
   - Submit the doubt. Notice KP balance deducts 25 KP immediately.

2. **Tab 2 (Student B - sachin)**:
   - Open in an incognito window or switch persona to Priya via the top demo banner.
   - See Aarav's new doubt appear in real time on the feed!
   - Click **"Help & Earn 25 KP"**.
   - Send the solution in chat: *"According to Faraday's law, the induced emf equals -dΦ/dt..."*

3. **Tab 1 (Aryan receives message in real time)**:
   - Aarav sees Priya's answer arrive instantly without refreshing.
   - Aarav clicks **"Mark as Resolved"**.

4. **Verify Live KP Transfer**:
   - The doubt is marked **Resolved**.
   - Priya's wallet increases by **30 KP** (25 staked + 5 platform bonus), and her `totalSolved` count increments!
