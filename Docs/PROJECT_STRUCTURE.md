# Drivix – Project Structure & Directory Reference

## 1. Monorepo Root Directory Layout

```
DrivixApps/
├── App/                       # Cross-platform Mobile App (Expo + React Native)
├── Docs/                      # System architecture, PRD, rules, and technical documentation
├── ml_service/                # Python FastAPI Machine Learning dynamic pricing subsystem
├── WebApp/                    # Primary web platform (Frontend SPA + Express Backend API)
│   ├── backend/               # Node.js + Express REST API server & Socket.IO hub
│   └── frontend/              # React 19 + Vite web client SPA
├── .agents/                   # Specialized agent configurations and skills
├── .github/                   # CI/CD GitHub Actions workflows
├── docker-compose.yml         # Multi-service production/local orchestration specification
├── exportBookings.js          # Firestore export utility script
├── generate_report.py         # ReportLab PDF report generation script
├── load_car_spa_centres.py    # OpenStreetMap Overpass API harvester for car wash centers
├── package.json               # Monorepo root scripts (concurrent execution of backend/frontend/ML)
├── README.md                  # Comprehensive project presentation and setup guide
└── skills-lock.json           # Agent skill integrity manifest
```

---

## 2. WebApp Backend Directory (`WebApp/backend/`)

```
WebApp/backend/
├── config/
│   ├── db.js                  # Mongoose connection logic with Atlas & local offline fallback
│   └── redis.js               # Redis cache client with reconnection strategies and memory fallbacks
├── controllers/
│   ├── authController.js      # User registration, login, JWT issuance, OTP, and user profile management
│   ├── bannerController.js    # Carousel marketing banner CRUD and click/impression telemetry
│   ├── bookingController.js   # Booking lifecycle, floor capacity sync, calculations, and cancellation
│   ├── complaintController.js # Support ticket creation, resolution, and admin remarks
│   ├── fastagController.js    # FASTag account registration, wallet recharges, and toll estimates
│   ├── gateController.js      # Reactive ANPR entry/exit simulation and barrier gate triggers
│   ├── parkingController.js   # Parking facilities, floor availability, slot CRUD, and soft-lock holds
│   ├── partnerController.js   # Parking facility partner onboarding application processing
│   ├── placeController.js     # Nearby hubs and points-of-interest discovery
│   └── vehicleController.js   # Vehicle registration, type classification, and primary car assignment
├── middleware/
│   ├── authMiddleware.js      # JWT verification (`protect`) and role guard (`adminOnly`)
│   └── errorMiddleware.js     # 404 route catcher and centralized JSON error formatter
├── models/
│   ├── Banner.js              # Marketing promotions and analytics schema
│   ├── Booking.js             # Core parking ticket booking schema (hybrid legacy/new architecture)
│   ├── CarWashCenter.js       # Detailing, spa, and wash facility directory schema
│   ├── Complaint.js           # User support complaints and resolution status schema
│   ├── EmailOtp.js            # Temporary registration OTP records with MongoDB TTL auto-expiry index
│   ├── EntryLog.js            # Gate ANPR entry/exit photo and timestamp verification schema
│   ├── FASTag.js              # FASTag digital wallet and auto-recharge threshold configuration schema
│   ├── FASTagTransaction.js   # Ledger records for FASTag debits and credits
│   ├── Notification.js        # User push/in-app notification alerts schema
│   ├── Parking.js             # Legacy parking facility schema (bound to 'parkinglocations')
│   ├── ParkingFacility.js     # Alternative parking facility model
│   ├── ParkingFloor.js        # Floor-level capacity schema (bound to ParkingLocation)
│   ├── ParkingLocation.js     # Authoritative parking hub entity schema (bound to 'parkinglocations')
│   ├── ParkingSlot.js         # Redundant/isolated parking slot schema
│   ├── Partner.js             # Facility operator application schema
│   ├── Payment.js             # Financial transaction log schema
│   ├── Place.js               # Geographical point-of-interest schema
│   ├── Review.js              # Star rating and feedback schema for parking locations
│   ├── Slot.js                # Authoritative individual parking slot schema with atomic lock fields
│   ├── User.js                # Core user account, credentials, vehicles, documents, and roles schema
│   └── Vehicle.js             # Standalone vehicle asset entity schema
├── repositories/
│   ├── emailOtpRepository.js  # Data access abstractions for EmailOtp operations
│   └── userRepository.js      # Data access abstractions for User lookups and creation
├── routes/
│   ├── authRoutes.js          # /api/v1/auth routes
│   ├── bannerRoutes.js        # /api/v1/banners routes
│   ├── bookingRoutes.js       # /api/v1/bookings routes
│   ├── complaintRoutes.js     # /api/v1/complaints routes
│   ├── fastagRoutes.js        # /api/v1/fastags routes
│   ├── gateRoutes.js          # /api/v1/gate routes
│   ├── parkingRoutes.js       # /api/v1/parking routes
│   ├── partnerRoutes.js       # /api/v1/partners routes
│   ├── placeRoutes.js         # /api/v1/places routes
│   ├── vehicleRoutes.js       # /api/v1/vehicles routes
│   └── washCenterRoutes.js    # /api/v1/wash-centers routes
├── seed/
│   ├── parking-ndmc.seed.js   # New Delhi Municipal Council parking lot seeds
│   ├── parking-noida-city.seed.js # Noida Metro / Commercial zone parking seeds
│   ├── parking-south-zone.seed.js # South Delhi parking facility seeds
│   └── parking.seed.js        # General baseline seed dataset
├── services/
│   ├── authService.js         # Authentication domain service (bcrypt hashing, JWT, OTP generation)
│   ├── emailService.js        # Nodemailer SMTP transporter and email template dispatch
│   └── SlotAllocationService.js # 7-criteria weighted scoring engine & optimistic concurrency locker
├── tests/
│   ├── test_phase1.js         # Phase 1 integration test: models, capacity calculations, and CRUD
│   ├── test_phase2.js         # Phase 2 integration test: dynamic slot allocation scoring & concurrency
│   └── test_phase3.js         # Phase 3 integration test: ANPR simulator entry and exit workflows
├── utils/
│   ├── migration.js           # Automated startup migration script linking slots/bookings to floors
│   ├── notificationService.js # Dispatcher for user booking confirmations and reminders
│   ├── pricingEngine.js       # Client caller for Python ML service with rule-based fallback
│   ├── seedBanners.js         # Startup seeder for active marketing banners
│   └── seedCarWashCenters.js  # Startup seeder for NCR car wash directory
├── Dockerfile                 # Node.js backend container configuration
├── package.json               # Backend dependencies, ES modules configuration, and npm scripts
└── server.js                  # Main Express entry point, Socket.IO binding, and background sweep workers
```

---

## 3. WebApp Frontend Directory (`WebApp/frontend/`)

```
WebApp/frontend/
├── public/                    # Static assets, logos, and favicons
├── src/
│   ├── assets/                # Media assets, vehicle icons, promotional videos, and badges
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx # Collapsible sidebar navigation for back-office administrators
│   │   │   └── AdminRoute.jsx  # Route guard validating JWT authentication and `role === 'admin'`
│   │   ├── animations/
│   │   │   ├── AnimatedParkingHero.jsx # Canvas visualizer for landing hero
│   │   │   └── GateAnimation.jsx       # 2D animated barrier boom pole for ANPR simulator
│   │   ├── common/
│   │   │   ├── AnimatedWatch.jsx       # HUD clock timer
│   │   │   ├── FadeIn.tsx              # Framer motion fade animation container
│   │   │   ├── LoadingScreen.tsx       # Initial application loading indicator
│   │   │   ├── NetworkMapModal.jsx     # Centered 360px floating popover interactive map modal
│   │   │   └── SupportModal.jsx        # Customer support ticket filing popup
│   │   ├── sections/                   # Modular landing page presentation components
│   │   │   ├── CaseStudiesSection.jsx
│   │   │   ├── FeaturesSection.jsx
│   │   │   ├── FooterSection.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   ├── HowItWorksSection.jsx
│   │   │   ├── PartnersSection.jsx
│   │   │   ├── ProblemSection.jsx
│   │   │   ├── ReasonsSection.jsx
│   │   │   ├── ServicesHubSection.jsx
│   │   │   └── ShowcaseSection.jsx
│   │   ├── AdCarousel.jsx              # Active marketing banner slider with tracking triggers
│   │   ├── Navbar.jsx                  # Navigation bar with role detection, wallet, and profile menu
│   │   └── VehicleBackground.jsx       # Ambient futuristic vehicle backdrop visualizer
│   ├── context/
│   │   ├── ToastContext.jsx            # Global toast notifications context and hook
│   │   └── UserContext.jsx             # Global user authentication session context (JWT in localStorage)
│   ├── hooks/
│   │   └── useUser.jsx                 # Convenience hook wrapper for UserContext
│   ├── pages/
│   │   ├── admin/                      # Complete back-office administrator suite
│   │   │   ├── AdminBanners.jsx        # Banner promotional campaign editor
│   │   │   ├── AdminBookings.jsx       # Live global booking list and cancellation control
│   │   │   ├── AdminComplaints.jsx     # Support ticket queue and resolution notes
│   │   │   ├── AdminDashboard.jsx      # High-level metrics, active slots, and facility counts
│   │   │   ├── AdminParking.jsx        # Facility and floor capacity configuration
│   │   │   ├── AdminPartners.jsx       # Partner application inspection and approval
│   │   │   ├── AdminPricing.jsx        # Dynamic pricing rules and simulator preview
│   │   │   ├── AdminRevenue.jsx        # Revenue analytics and financial reporting
│   │   │   └── AdminUsers.jsx          # User accounts, membership tiers, and role promotions
│   │   ├── AboutUs.jsx                 # Company background, vision, and team
│   │   ├── AnprGateSimulator.jsx       # Live optical scan simulator for entry and exit gates
│   │   ├── Auth.jsx                    # Login / Register tabs, Email OTP verification, Google OAuth
│   │   ├── Booking.jsx                 # Legacy/unused booking page (redirected to /find)
│   │   ├── Home.jsx                    # Alternative landing view
│   │   ├── LandingPage.jsx             # Primary public landing showcase page
│   │   ├── ParkingList.jsx             # Search and discovery list with filter chips and map toggle
│   │   ├── PartnerLandingPage.jsx      # Facility operator registration form
│   │   ├── Profile.jsx                 # Driver profile, vehicles, document vault, active tickets
│   │   ├── Safety.jsx                  # SOS protocols, safety standards, and customer assurance
│   │   ├── SlotBookingForm.jsx         # Booking finalization, vehicle selection, amenities, and payment
│   │   ├── SlotLayout.jsx              # Multi-floor 2D interactive grid with atomic soft-locking
│   │   ├── Ticket.jsx                  # Digital QR parking pass with 1-tap live GPS navigation
│   │   └── VehicleServices.jsx         # Car care, wash, and detailing directory with vehicle filters
│   ├── ParkingFacility/
│   │   └── ShardaParking.js            # Unused legacy Firestore seed script
│   ├── services/
│   │   └── ParkingService.js           # Unused legacy Firestore parking listener
│   ├── store/
│   │   └── bookingStore.ts             # Zustand store managing booking draft parameters across pages
│   ├── utils/
│   │   └── navigationUtils.js          # Direct live GPS navigation dispatcher (Google Maps driving mode)
│   ├── App.css                         # Application style overrides
│   ├── App.jsx                         # Main route router with ErrorBoundary and LoadingScreen
│   ├── config.js                       # Environment domain mapping (Vercel vs Render vs localhost)
│   ├── ErrorBoundary.jsx               # React error boundary catching rendering exceptions
│   ├── firebase.js                     # Mock Firebase initialization stub
│   ├── index.css                       # Global design system tokens, typography, and glassmorphism styles
│   └── main.jsx                        # React root bootstrap element
├── Dockerfile                          # Production Nginx multi-stage build specification
├── package.json                        # Frontend dependencies and Vite scripts
└── vite.config.js                      # Vite build configuration
```

---

## 4. Mobile App Directory (`App/`)

```
App/
├── assets/                    # Mobile app splash screens, icons, fonts, audio files, and YOLO models
├── scripts/                   # Development reset and testing scripts
├── src/
│   ├── api/                   # Typed API service wrappers (Axios client with JWT token interceptors)
│   │   ├── authApi.ts         # User authentication, registration, profile, and OTP endpoints
│   │   ├── bookingApi.ts      # Booking creation, my bookings, cancel, vacate, and calculate bill
│   │   ├── client.ts          # Central Axios client instance with 15-second timeout and 401 handling
│   │   ├── complaintApi.ts    # Support complaints filing endpoints
│   │   ├── parkingApi.ts      # Facilities, floors, and slot availability endpoints
│   │   ├── vehicleApi.ts      # Vehicle asset CRUD endpoints
│   │   └── washApi.ts         # Car wash centers directory endpoints
│   ├── app/                   # Expo Router file-based entry
│   │   ├── _layout.tsx        # Root layout initializing Socket.IO and wrapping Context Providers
│   │   └── index.tsx          # App entry invoking DrivixRootNavigator
│   ├── components/            # Reusable mobile UI components
│   │   ├── common/            # Buttons, Cards, Inputs, Badges, StepIndicators, NetworkMapModal
│   │   ├── ui/                # Icon symbols and responsive layout primitives
│   │   ├── animated-icon.tsx  # Animated splash screen overlay
│   │   └── QRPacketPass.tsx   # High-security QR code pass rendering for gate entry
│   ├── config/
│   │   └── index.ts           # Mobile domain mapping (Render production vs Android Emulator 10.0.2.2)
│   ├── constants/             # Mobile color tokens and layout constants
│   ├── hooks/                 # Custom React Native hooks (theme, network status, color schemes)
│   ├── navigation/
│   │   └── AppNavigator.tsx   # React Navigation Native Stack and Bottom Tabs hierarchy
│   ├── screens/               # Mobile screen components
│   │   ├── auth/              # LoginScreen, RegisterScreen
│   │   ├── booking/           # FloorSelection, DurationSelection, VehicleSelection, Review, Confirmation
│   │   ├── history/           # BookingHistoryScreen (active, completed, and cancelled tickets)
│   │   ├── home/              # HomeScreen (clean mobility grid, vehicle command center, active pass)
│   │   ├── navigation/        # NavigationScreen (in-app routing HUD)
│   │   ├── parking/           # ParkingDiscoveryScreen, ParkingDetailScreen
│   │   ├── profile/           # ProfileScreen, ActiveParkingScreen
│   │   └── wash/              # CarWashDiscoveryScreen
│   ├── services/              # Native device service bridges
│   │   ├── bookingEligibility.ts # Rules checking online booking allowance
│   │   ├── firebaseAuthService.ts # Mock dummy auth service
│   │   ├── fuelRateService.ts    # Daily fuel price lookup service
│   │   ├── locationService.ts    # Expo Location wrapper with permission and distance math
│   │   ├── navigation.ts         # Native GPS turn-by-turn driving deep link dispatcher
│   │   ├── socket.ts             # Socket.IO client with AppState foreground/background handlers
│   │   ├── storage.ts            # AsyncStorage abstraction for JWT auth token persistence
│   │   ├── vehicleCareServices.ts # In-hub vehicle care amenity metadata
│   │   └── vehicleUtilities.ts   # E-Challan lookup and roadside assistance utility functions
│   ├── store/                 # Mobile state management
│   │   ├── AuthContext.tsx    # User session, JWT tokens, and login/register actions
│   │   └── BookingContext.tsx # Mobile booking draft parameters and hub selection state
│   ├── theme/                 # Dark mode design tokens (colors, shadows, spacing, typography)
│   └── types/                 # Shared TypeScript interfaces for entities and API responses
├── app.json                   # Expo application manifest, permissions, and build configuration
└── package.json               # React Native dependencies and Expo scripts
```

---

## 5. Machine Learning Service Directory (`ml_service/`)

```
ml_service/
├── api/
│   ├── main.py                # FastAPI microservice entry point, CORS, lifespan startup, and health
│   └── routes.py              # Pricing quote, occupancy forecasting, online learning, and MLOps routes
├── data/
│   ├── processed/             # Engineered train/test/validation CSV datasets
│   ├── raw/                   # Raw sensor observations and synthetic transaction datasets
│   └── inference_logs.jsonl   # Asynchronous inference logging for drift and audit tracking
├── models/
│   ├── archive/               # Historical champion model snapshots for instant rollback
│   ├── drivix_price_model.pkl # Production Champion XGBoost pricing model pipeline
│   ├── occupancy_forecaster.joblib # Stage 1 HistGradientBoosting sensor occupancy model
│   ├── online_learner.joblib  # Continuous SGD online adaptive residual learner state
│   └── preprocessor.joblib    # Sklearn ColumnTransformer preprocessing artifact
├── notebooks/                 # Jupyter exploration, preprocessing, and training notebooks (01 to 06)
├── reports/
│   ├── drift_reports/         # Generated Kolmogorov-Smirnov and PSI drift analysis reports
│   ├── figures/               # Matplotlib/Seaborn correlation matrices and feature importance charts
│   ├── final_test_metrics.json # Production model benchmark metrics
│   └── retraining_history.json # Audit ledger of automated retraining executions
├── src/
│   ├── data_preprocessing.py  # Cleaning, missing value imputation, and dataset partitioning
│   ├── db_connector.py        # PyMongo database connector with ground-truth calculation
│   ├── db_sync_worker.py      # Watermark-based batch database synchronizer for online learning
│   ├── drift_detector.py      # Real-time KS and PSI drift detection calculation engine
│   ├── evaluate.py            # Model scoring (MAE, RMSE, R2, MAPE)
│   ├── feature_engineering.py # Cyclical hour/day transformations, moving windows, and interaction features
│   ├── inference_logger.py    # Asynchronous non-blocking disk logger for prediction requests
│   ├── occupancy_forecaster.py# Stage 1 30-minute sensor occupancy projection engine
│   ├── online_learner.py      # OnlineAdaptiveResidualLearner running incremental SGD partial_fit
│   ├── predict.py             # InferenceEngine loading pipelines and calculating price quotes
│   ├── retrain_pipeline.py    # Automated retraining pipeline with Champion-vs-Challenger validation
│   └── train.py               # Standalone training script for champion XGBoost model
├── tests/                     # Pytest suite validating inference, MLOps, features, and online learning
├── Dockerfile                 # Python 3.10 slim FastAPI container specification
└── requirements.txt           # Python package requirements (fastapi, uvicorn, scikit-learn, xgboost, pymongo)
```

