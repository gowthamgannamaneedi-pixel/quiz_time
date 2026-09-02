# SyncQuiz Mobile — Offline College Event Quiz Application

A modern, touch-optimized, **100% frontend-only** mobile quiz application built with **React Native, Expo, TypeScript, and Expo Router** for conducting college quizzes for ~400 students with zero remote backend/database requirements.

---

## 1. Features & Architecture

```
                       STUDENT MOBILE DEVICE (Expo / React Native)
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
      [ 1. PIN Entry (6 Digits) ]                           [ 2. QR Code Scanner ]
      (e.g., PIN: 123456)                                   (quizapp://quiz/123456)
                │                                                     │
                └──────────────────────────┬──────────────────────────┘
                                           ▼
                             [ Local Quiz Validator ]
                               (src/data/quizzes.ts)
                                           │
                                           ▼
                               [ Quiz Ready Screen ]
                                 - Quiz Overview
                                 - Duration & Questions
                                 - Scoring Rules (+4 / -1)
                                 - [ START QUIZ CTA ]
```

### Key Principles:
- **100% Frontend-Only**: Zero cloud servers, databases, or API latencies.
- **Dual Entry**: 6-digit numeric PIN entry and camera QR code scanning (`quizapp://quiz/<pin>`).
- **No Personal Data**: Fast, anonymous, frictionless entry.
- **Deep Linking**: Configured with custom scheme `quizapp://` in `app.json`.

---

## 2. Project Structure

```
quiz_time/
├── app/
│   ├── _layout.tsx           # Stack Navigator & deep link listener
│   ├── index.tsx             # Home Screen (PIN Entry + QR Scanner CTA)
│   ├── scan.tsx              # Camera Barcode/QR Scanner with Viewfinder
│   ├── ready/[pin].tsx       # Quiz Ready Screen (Overview & Start CTA)
│   └── quiz/[pin].tsx        # Quiz Examination Screen placeholder
├── src/
│   ├── components/
│   │   ├── Button.tsx        # Large touch-friendly button variants
│   │   ├── PinInput.tsx      # 6-box segmented PIN input component
│   │   ├── Card.tsx          # Dark glassmorphic card container
│   │   └── Header.tsx        # Mobile header with back navigation
│   ├── data/
│   │   └── quizzes.ts        # Bundled offline quiz definitions
│   ├── hooks/
│   │   └── useQuiz.ts        # Quiz lookup and PIN validation hook
│   ├── types/
│   │   └── quiz.types.ts     # TypeScript interfaces
│   └── utils/
│       └── deepLink.ts       # QR parser for quizapp:// and 6-digit PINs
├── app.json                  # Expo config with camera permissions & scheme
├── package.json
└── tsconfig.json
```

---

## 3. Pre-configured Quizzes for Testing

| Quiz Title | 6-Digit PIN | Questions | Duration | Max Marks |
|---|---|---|---|---|
| **Computer Science Championship 2026** | `123456` | 10 MCQs | 30 mins | 40 marks |
| **Engineering Mathematics Challenge** | `654321` | 5 MCQs | 20 mins | 20 marks |
| **General Science & Innovation Quiz** | `888888` | 3 MCQs | 15 mins | 12 marks |
| **Quick Demo Quiz** | `999999` | 3 MCQs | 5 mins | 12 marks |

---

## 4. Running the App Locally

### Step 1: Start Expo Development Server
```powershell
# Start Expo Metro Bundler
npm run start
```

### Step 2: Open on Device or Simulator
- **Android Device / Emulator**: Press `a` or scan the Metro QR code using Expo Go app.
- **iOS Simulator / Device**: Press `i` or scan with iOS Camera.
- **Web Browser**: Press `w` or run `npm run web`.

---

## 5. Phase 1 Deliverables Checklist

- [x] React Native + Expo + Expo Router + TypeScript project configuration
- [x] Deep linking scheme (`quizapp://quiz/<pin>`) configured in `app.json`
- [x] Professional dark mobile UI with typography, spacing, and touch targets
- [x] 6-digit segmented PIN input component with auto-focus and auto-advance
- [x] Camera QR Code Scanner with viewfinder frame and torch toggle
- [x] Local quiz database (`src/data/quizzes.ts`) with multiple event quizzes
- [x] PIN validation and QR deep link parsing logic
- [x] Quiz Ready Screen with metadata breakdown and Start CTA
- [x] Type check verification with `npm run typecheck` passing (0 errors)
