# FairBuy AI - Smart Shopping & Price Intelligence Platform

> **"Know. Compare. Buy Smart."**

FairBuy AI is an AI-powered smart shopping and price intelligence platform built to help customers determine whether a product offered by a local seller is actually worth buying at the quoted price.

The platform identifies products (via image scanning, camera, barcode SKU, or text search), understands the user's location, collects live and observed market price signals across online and local retail channels, analyzes public review sentiment, calculates an estimated fair price range (using median and interquartile statistical bounds), and delivers a clear **BUY / CONSIDER / AVOID** recommendation.

---

## Key Features

- **Price Intelligence Engine**: Normalizes price signals, filters outliers, and calculates statistical median, lower/upper fair bounds ($Q_1 - 0.25 \times IQR$ to $Q_3 + 0.25 \times IQR$), and data freshness timestamps.
- **Buying Decision Engine**: Multi-factor decision matrix outputting a score (0–100), transparent component ratings (Price, Quality, Reviews, Value, Availability), and status badges (`BUY`, `CONSIDER`, `AVOID`).
- **Visual Price Fairness Spectrum**: Clear interactive graph marking quoted seller price vs estimated fair market range.
- **Public Review & Value Analysis**: Aspect sentiment extraction (durability, battery, performance, packaging, connectivity), pros/cons summary, and overall value rating.
- **Location Context Engine**: Device Geolocation API with explicit permission prompt, reverse geocoding to City, State, Country (defaulting to Nashik, Maharashtra, India), and manual location picker.
- **Ask FairBuy AI Assistant**: Floating AI shopping assistant answering product questions ("Why is this expensive?", "Is there a cheaper alternative?", "Is this good for travel?").
- **Alternative Recommendations & Requirement Matcher**: Side-by-side spec comparison table and "Tell FairBuy what you need" natural language requirements matcher.
- **Demo Mode**: Built-in realistic sample market observations for hackathon demonstrations or offline environments.

---

## Project Structure

```
Survey Snap AI /
├── backend/
│   ├── src/
│   │   ├── db/              # Sample dataset & settings persistence
│   │   ├── routes/          # Express REST API endpoints
│   │   ├── services/        # Product, Price, Review, Decision, Location & Chat services
│   │   ├── types/           # Domain TypeScript definitions
│   │   └── server.ts        # Express server startup
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, TopHeader, MobileNav, PriceFairnessGraph, WhyThisPriceModal, AskFairBuyDrawer
│   │   ├── pages/           # Dashboard, Analyze, ProductAnalysis, PriceIntelligence, Reviews, BuyDecision, Alternatives, History, Settings
│   │   ├── services/        # API client & HTTP handlers
│   │   ├── types/           # Domain TypeScript types
│   │   ├── App.tsx          # Main application shell & router
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── README.md
```

---

## Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## Running the Application

### Option A: Run Backend Server
```bash
cd backend
npm run dev
```
Backend API will start at: `http://localhost:5000`

### Option B: Run Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend Web UI will start at: `http://localhost:3000`

---

## API Endpoints

- `POST /api/products/identify` - Identifies product from image, barcode, or query.
- `POST /api/products/analyze` - Runs full price intelligence, review sentiment, fair price calculation, and buying decision engine.
- `GET /api/products/:id` - Fetches single product analysis details.
- `GET /api/products/:id/prices` - Retrieves price observations and market signals.
- `GET /api/products/:id/reviews` - Returns review sentiment and aspect scores.
- `POST /api/fair-price/calculate` - Recalculates statistical fair price bounds.
- `POST /api/buy-decision` - Computes buying recommendation score & component metrics.
- `POST /api/recommendations` - Matches natural language user requirements against product catalog.
- `POST /api/location/reverse-geocode` - Geocodes lat/lng coordinates or saves manual city selection.
- `GET /api/history` - Fetches audit trail of past checks.
- `POST /api/chat` - Answers product questions using the active analysis context.
- `GET /api/settings` & `PUT /api/settings` - Reads & updates platform settings.

---

## Environment & Configuration

Create a `.env` file in `backend/` for live production keys:

```env
PORT=5000
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_CITY=Nashik
DEFAULT_STATE=Maharashtra
```

---

## Production Deployment

1. Build backend TypeScript:
   ```bash
   cd backend
   npm run build
   ```
2. Build frontend React static assets:
   ```bash
   cd frontend
   npm run build
   ```
3. Start production server:
   ```bash
   cd backend
   npm start
   ```

The Express backend automatically serves the compiled frontend static bundle from `frontend/dist` on port 5000.
