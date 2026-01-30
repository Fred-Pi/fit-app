# Fitness Tracking App

A comprehensive, unified fitness tracking mobile app that combines gym workouts, calorie tracking, step counting, personal records, and workout templates in one cohesive solution.

## Overview

This app provides an all-in-one fitness tracking experience with:

- **Gym Tracking**: Log workouts with exercise database, sets, reps, and weight
- **Exercise Library**: Browse 54+ exercises and create custom exercises with full CRUD
- **Personal Records**: Automatically track your strength gains and PRs
- **Workout Templates**: Save and reuse your favorite workout routines
- **Analytics Dashboard**: Visualize your progress with interactive charts and insights
- **1RM Calculator**: Calculate your one rep max and compare to strength standards
- **Calorie & Nutrition**: Track daily meals with calories and macros
- **Steps & Activity**: Monitor daily step count toward your goal
- **Weekly Statistics**: Track progress with week-over-week comparisons
- **Rest Timer**: Built-in countdown timer between sets
- **Unified Daily View**: See your complete fitness snapshot in one place

## Target User

Regular gym-goer trying to lose fat and/or gain muscle who:
- Tracks workouts 3-5x per week
- Wants to track strength gains and personal bests
- Prefers simplicity over complex features
- Values seeing progress over time

## Tech Stack

- **React Native** with Expo SDK 54 (TypeScript)
- **React Navigation** (bottom tabs + stack navigation)
- **Zustand** for state management with centralized stores
- **SQLite** (expo-sqlite) for local-first data persistence
- **Expo Vector Icons** for UI
- Compiled for **iOS, Android, and Web**

## Project Structure

```
src/
├── types/              # TypeScript type definitions
│   └── index.ts
├── stores/             # Zustand state management
│   ├── index.ts        # Store exports
│   ├── userStore.ts    # User profile and preferences
│   ├── workoutStore.ts # Workouts, templates, PRs (with caching)
│   ├── nutritionStore.ts # Daily nutrition and meals
│   ├── dailyTrackingStore.ts # Steps, weight, weekly stats
│   └── uiStore.ts      # Modal state and UI
├── services/           # Data storage and business logic
│   ├── database.ts     # SQLite database management
│   └── storage.ts      # Data access layer
├── screens/            # Main app screens
│   ├── TodayScreen.tsx
│   ├── WorkoutsScreen.tsx
│   ├── WorkoutDetailScreen.tsx
│   ├── ExerciseLibraryScreen.tsx
│   ├── ExerciseDetailScreen.tsx
│   ├── AnalyticsScreen.tsx
│   ├── NutritionScreen.tsx
│   ├── AchievementsScreen.tsx
│   └── ProfileScreen.tsx
├── components/         # Reusable UI components
│   ├── Card.tsx
│   ├── ProgressBar.tsx
│   ├── GlobalModals.tsx # Centralized modal rendering
│   ├── ExercisePicker.tsx
│   ├── ExerciseCard.tsx
│   ├── SwipeableRow.tsx
│   ├── ExpandableFAB.tsx
│   ├── TemplatePicker.tsx
│   ├── RestTimer.tsx
│   ├── WorkoutTimer.tsx
│   ├── AddWorkoutModal.tsx
│   ├── EditWorkoutModal.tsx
│   ├── analytics/      # Analytics and strength components
│   │   └── StrengthCalculator.tsx
│   └── ...
├── navigation/         # Navigation setup
│   ├── AppNavigator.tsx
│   └── WorkoutsStack.tsx
├── hooks/             # Custom React hooks
│   ├── useTimer.ts
│   ├── useResponsive.ts
│   └── useAnalyticsData.ts
├── data/              # Static data and databases
│   └── exercises.ts   # Exercise database (54 exercises)
└── utils/             # Utilities and helpers
    ├── dateUtils.ts   # Week calculation utilities
    ├── sampleData.ts  # Sample data generator
    ├── exerciseHelpers.ts  # Exercise management utilities
    ├── analyticsCalculations.ts  # Analytics data processing
    ├── analyticsChartConfig.ts   # Chart configurations
    ├── oneRepMax.ts   # 1RM calculation formulas
    ├── strengthStandards.ts  # Strength level standards
    ├── haptics.ts     # Haptic feedback utilities
    └── theme.ts       # Color theme
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Running on Simulators

```bash
# iOS (requires macOS)
npm run ios

# Android
npm run android

# Web
npm run web
```

### Build for Production

```bash
# Web build
npm run build:web
```

## Features

### Core Features

#### 🏋️ Workout Tracking
- **Log workouts** with exercise name, sets, reps, and weight
- **Exercise database** with 54 common exercises organized by muscle group:
  - Chest (8 exercises)
  - Back (10 exercises)
  - Shoulders (7 exercises)
  - Arms (8 exercises)
  - Legs (10 exercises)
  - Core (6 exercises)
  - Cardio (5 exercises)
- **Custom exercises** - Add exercises not in the database
- **Edit workouts** - Modify past workouts
- **Delete workouts** - Remove workouts with confirmation
- **Workout history** - View all past workouts sorted by date
- **Workout detail view** - See full exercise breakdown with sets and reps

#### 🏆 Personal Records (PRs)
- **Automatic PR tracking** - Detects new personal bests when logging workouts
- **PR notifications** - Congratulatory alerts when you set new PRs
- **PR screen** - Dedicated tab showing all personal records
- **Categorized display** - PRs grouped by muscle group with color coding
- **PR management** - View and delete personal records
- Shows exercise name, weight, reps, and date achieved

#### 📋 Workout Templates
- **Save workouts as templates** - Convert any workout into a reusable template
- **Template library** - Browse all saved templates in Profile screen
- **Quick workout creation** - Load templates to instantly populate exercises
- **Template management** - Delete templates with confirmation
- **Customizable** - Modify template before saving as workout

#### 📚 Exercise Library
- **Browse exercise database** - 54 built-in exercises organized by muscle group
- **Custom exercises** - Create your own exercises with full CRUD operations
- **Exercise details** - View exercise information, default sets/reps, usage statistics
- **Workout history** - See all workouts that include a specific exercise
- **Search and filter** - Find exercises by name or filter by category
- **View toggles** - Filter by All, Built-in, or Custom exercises
- **Swipeable actions** - Quick edit/delete for custom exercises
- **Custom badges** - Visual indicators for user-created exercises
- **Edit with workout updates** - Option to rename exercise across all workouts

#### 📊 Analytics Dashboard
- **Workout frequency chart** - Visualize workouts per week over time
- **Volume progression** - Track total weight lifted with trend analysis
- **Exercise distribution** - Pie chart showing muscle group balance
- **Weight progression** - Line chart tracking strength gains per exercise
- **Personal records timeline** - Chronological view of PRs achieved
- **Summary statistics** - Total workouts, volume, PRs, and active days
- **Interactive charts** - Touch to see detailed data points
- **Time period filters** - View 1, 3, or 6 month analytics
- **Trend indicators** - See if metrics are improving or declining

#### 💪 1RM Calculator & Strength Standards
- **One Rep Max calculator** - Estimate your 1RM from any weight/rep combination
- **Multiple formulas** - Uses Epley, Brzycki, Lander, and Lombardi formulas with averaged result
- **Strength standards** - Compare your lifts to population benchmarks (Beginner to Elite)
- **Supported lifts** - Bench Press, Squat, Deadlift, Overhead Press, Barbell Row
- **Body weight ratios** - Standards based on your logged body weight
- **Gender-specific** - Toggle between male and female strength standards
- **Progress tracking** - See your progress percentage toward the next strength level
- **Training weights table** - Shows recommended weights for different rep ranges based on your 1RM

#### ⏱️ Rest Timer
- **Built-in countdown timer** - Time your rest periods between sets
- **Quick presets** - 30s, 60s, 90s, 120s, 180s buttons
- **Visual progress** - Large circular timer with progress ring
- **Vibration feedback** - Phone vibrates when timer completes
- **Alert notification** - Pop-up when rest period is over
- **Start/pause/reset controls** - Full timer management

#### 📊 Weekly Statistics
- **Weekly overview** - See current week's progress at a glance
- **Week-over-week comparison** - Compare to previous week with arrows and percentages
- **Metrics tracked**:
  - Total workouts completed
  - Total/average calories vs target
  - Total/average steps vs goal
  - Days active
- **Color-coded indicators** - Green for improvements, red for decreases
- **Progress bars** - Visual completion percentage

#### 🍽️ Nutrition Tracking
- **Log meals** with calories and macros (protein, carbs, fats)
- **Daily calorie target** with progress bar
- **Macro breakdown** - Visual distribution of protein, carbs, and fats
- **Meal history** - View all meals for the day
- **Nutrition screen** - Dedicated tab for detailed nutrition view

#### 👟 Step Tracking
- **Manual step entry** - Update your daily step count
- **Daily step goal** tracking with progress bar
- **Quick update** from Today screen
- **Step history** - Track steps over time

#### 🎨 User Interface
- **Modern dark theme** - Rich blue-gray backgrounds with vibrant accents
- **Responsive design** - Works on iOS, Android, and Web
- **Smooth animations** - Modal transitions and screen changes
- **Consistent styling** - Rounded corners and cohesive design language
- **Color coding**:
  - 🟢 Green for Today/Steps
  - 🔵 Blue for Workouts
  - 🟣 Purple for Exercises
  - 🟡 Gold for Personal Records
  - 🟠 Orange for Analytics
  - 🔴 Red for Nutrition
  - 🟣 Purple for Profile

#### ⚙️ User Profile & Settings
- **Edit profile** - Name, calorie target, step goal
- **Weight units** - Toggle between lbs and kg
- **Template management** - View and delete workout templates
- **Sample data** - Load test data for exploring the app
- **Data management**:
  - Delete workouts
  - Delete nutrition data
  - Delete steps
  - Reset all data

### Navigation

Seven-tab bottom navigation:
1. **Today** - Daily overview dashboard
2. **Workouts** - Exercise tracking and history
3. **Exercises** - Exercise library and custom exercise management
4. **PRs** - Personal records
5. **Analytics** - Charts and progress visualization
6. **Nutrition** - Calorie & macro tracking
7. **Profile** - Settings and preferences

## Data Models

### Core Entities

- **User**: Profile with daily calorie target and step goal
- **WorkoutLog**: Individual workout session with exercises
- **ExerciseLog**: Exercise within a workout (sets, reps, weight)
- **PersonalRecord**: Best performance for each exercise
- **WorkoutTemplate**: Saved workout routine for reuse
- **DailyNutrition**: Daily meal tracking with calorie target
- **Meal**: Individual meal entry with macros
- **DailySteps**: Daily step count and goal
- **WeeklyStats**: Aggregated weekly statistics
- **Exercise**: Exercise from the database

All data is stored locally using SQLite for a fast, offline-first experience with efficient indexed queries.

## Usage Guide

### Today Screen

The main dashboard showing:
- **Weekly statistics card** - Current week progress vs previous week
- Current date
- Today's workout (or option to log)
- Calorie progress with visual bar
- Step progress with visual bar

Pull down to refresh data.

### Logging a Workout

1. Tap "Log Workout" from Today screen
2. (Optional) Tap "Use Template" to load a saved routine
3. Enter workout name
4. Add exercises:
   - Tap "Select from exercise database" to browse 54+ exercises
   - Or enter a custom exercise name
   - Set number of sets, reps, and weight
   - Tap "Add Exercise"
5. Repeat for all exercises
6. (Optional) Tap timer icon to start rest timer between sets
7. (Optional) Tap "Save as Template" to reuse this workout
8. Tap "Save" to log the workout
9. If you set any PRs, you'll see a congratulatory alert!

### Viewing Personal Records

1. Navigate to **PRs** tab
2. Browse records grouped by muscle group
3. See your best weight and reps for each exercise
4. Tap trash icon to delete a record

### Using the Rest Timer

1. While logging a workout, tap the timer icon in the header
2. Select a preset time (30s, 60s, 90s, 120s, 180s)
3. Tap "Start" to begin countdown
4. Timer will vibrate and alert when complete
5. Use "Pause" or "Reset" as needed

### Creating Workout Templates

1. Log a workout as usual
2. After adding exercises, tap "Save as Template"
3. Enter a template name
4. Template is saved to your library

### Using Templates

1. When logging a workout, tap "Use Template"
2. Select from your saved templates
3. Exercises auto-populate with sets, reps, and weights
4. Modify as needed before saving

### Workouts Screen

- View workout history (sorted by newest first)
- Tap any workout to see full details
- Edit or delete workouts from detail screen

### Nutrition Screen

- Daily calorie summary with progress
- Macro breakdown (protein, carbs, fats)
- List of logged meals with totals
- Add meals with "+" button

### Profile Screen

- Edit your profile information
- View workout templates
- View app information
- Load sample data for testing
- Manage and delete your data

## Development

### Adding Sample Data

To test the app with sample data:

1. Go to Profile tab
2. Scroll to "Testing" section
3. Tap "Load Sample Data"

This creates:
- 7 sample workouts (past week)
- Nutrition data with meals
- Step count data
- Some personal records

### Key Files to Modify

- **Add a new screen**: Create in `src/screens/` and add to navigation
- **Add data models**: Update `src/types/index.ts`
- **Add storage functions**: Update `src/services/storage.ts`
- **Add reusable components**: Create in `src/components/`
- **Add exercises**: Update `src/data/exercises.ts`

### Available Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
npm run build:web  # Build for web production
npm test           # Run tests
```

## Design Decisions

### Local-First Architecture

The app uses SQLite (expo-sqlite) for local data persistence without requiring a backend. This provides:

- **Fast performance**: Indexed queries with no network latency
- **Offline-first**: Works without internet
- **Simple setup**: No backend required
- **Privacy**: All data stays on device
- **Relational data**: Proper foreign keys and data integrity
- **Easy to extend**: Cloud sync can be added later

### State Management

The app uses Zustand for centralized state management with 5 domain-specific stores:

- **userStore**: User profile and preferences
- **workoutStore**: Workouts, templates, personal records (with 5-minute caching)
- **nutritionStore**: Daily nutrition and meals with computed totals
- **dailyTrackingStore**: Steps, weight, and weekly statistics
- **uiStore**: Modal visibility and UI state

Benefits:
- **Selective subscriptions**: Components only re-render when their specific data changes
- **Centralized modals**: All modals rendered at root level via GlobalModals
- **Built-in caching**: Prevents redundant database queries
- **Simple API**: No boilerplate, just `useStore((s) => s.value)`

### Automatic PR Tracking

PRs are detected automatically using this logic:
1. When a workout is saved, check each exercise
2. Find the best set (highest weight, then highest reps)
3. Compare to existing PR for that exercise
4. If better, save new PR and show notification

### Week Calculation

Weeks run Monday-Sunday (standard fitness week):
- Current week stats calculated on-demand
- Previous week comparison shown in weekly stats card
- Week boundaries handled automatically

### Exercise Categorization

Exercises are categorized by muscle group for easy browsing and PR organization. Custom exercises default to "Other" category.

## Troubleshooting

### Clear App Data

To reset the app:
1. Go to Profile tab
2. Scroll to "Delete Data" section
3. Choose what to delete:
   - Delete All Workouts
   - Delete All Nutrition
   - Delete All Steps
   - Reset All Data (deletes everything including templates and PRs)

### Common Issues

- **App won't load**: Run `npm install` and restart
- **Data not persisting**: Check AsyncStorage permissions
- **TypeScript errors**: Run `npx tsc --noEmit` to check
- **Build fails**: Clear cache with `expo start -c`

## Production Features

### Error Monitoring (Sentry)
- Production error tracking with Sentry
- Automatic crash reporting
- Configure via `EXPO_PUBLIC_SENTRY_DSN` environment variable

### Data Export
- Export all fitness data as JSON from Profile screen
- Includes workouts, nutrition, steps, and weight history
- Share via system share sheet

### Cloud Sync (Optional)
- Sync status indicator in Profile screen
- Offline-first with background sync queue
- Configure Supabase for cloud backup

### Accessibility
- Screen reader support for key components
- Accessible labels on buttons, tabs, and interactive elements
- Progress bar announcements

### Testing
- Unit tests for validation utilities
- Store and analytics calculation tests
- Run with `npm test`

## Future Enhancements

Potential features for future development:

1. **HealthKit/Google Fit integration** - Automatic step syncing
2. **Photo progress** - Before/after photos with timeline
3. **Biometric authentication** - Face ID/fingerprint app lock
4. **Widgets** - iOS/Android home screen widgets
5. **Push notifications** - Workout reminders

## Version History

### Current Version (v1.2.0)

**New in v1.2.0:**
- ✅ Sentry error monitoring for production
- ✅ Data export feature (JSON)
- ✅ Sync status indicator
- ✅ Improved accessibility support
- ✅ Additional test coverage

**Core Features:**
- ✅ Workout logging with exercise database
- ✅ Exercise library with custom exercise CRUD
- ✅ Personal records tracking
- ✅ Workout templates
- ✅ Analytics dashboard with interactive charts
- ✅ 1RM calculator with multiple formulas
- ✅ Strength standards comparison (Beginner to Elite)
- ✅ Rest timer
- ✅ Weekly statistics
- ✅ Nutrition tracking
- ✅ Step tracking
- ✅ Edit/delete workouts
- ✅ Dark mode UI
- ✅ Web, iOS, and Android support

## License

This is a personal project for demonstration purposes.

---

Built with React Native + Expo

**Live Demo:** [https://fit-app-smoky.vercel.app/](https://fit-app-smoky.vercel.app/)
