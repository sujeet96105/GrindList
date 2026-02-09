# GrindList

Offline-first task app for Android with focus mode, insights, tags/categories, subtasks,
reminders, gamification, and a NestJS + Postgres backend.

## Prerequisites
- Node.js >= 20
- Android SDK + device or emulator
- Postgres (for backend)

## App (React Native)
Start Metro:
```bash
npm start
```

Run on Android (USB device or emulator):
```bash
npm run android
```

Run tests:
```bash
npm run test:app
```

## Backend (NestJS)
```bash
cd backend
npm install
```

Create `.env` from `backend/.env.example`, then run:
```bash
npm run start:dev
```

Run migrations:
```bash
npm run build
npm run migration:run
```

Seed demo data:
```bash
npm run seed
```

## Run App + Backend Together
1. Start Postgres:
```bash
cd backend
docker compose up -d
```
2. Run backend:
```bash
cd backend
npm run build
npm run migration:run
npm run start:dev
```
3. In another terminal, run the app:
```bash
npm start
```
Then:
```bash
npm run android
```

## Notes
- Location reminders are foreground-only (no background geofencing).
- iOS is not in scope for MVP.
