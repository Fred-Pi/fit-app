# Fitness Tracking App - MVP

A simple, unified fitness tracking app that combines gym workouts, calorie tracking, and step counting in one cohesive mobile solution.

## Overview

This app replaces the need for separate gym, calorie, and step-counter apps by providing:

- **Gym Tracking**: Log workouts, exercises, sets, reps, and weight
- **Calorie & Nutrition**: Track daily meals with calories and macros
- **Steps & Activity**: Monitor daily step count toward your goal
- **Unified Daily View**: See your complete fitness snapshot in one place

## Target User

Regular gym-goer trying to lose fat and/or gain muscle who:
- Tracks workouts 3-5x per week
- Wants awareness of calories and daily steps
- Prefers simplicity over complex features

## Tech Stack

- **React Native** with Expo (TypeScript)
- **React Navigation** (bottom tabs)
- **AsyncStorage** for local-first data persistence
- **Expo Vector Icons** for UI

## Project Structure

```
src/
├── types/              # TypeScript type definitions
│   └── index.ts
├── services/           # Data storage and business logic
│   └── storage.ts
├── screens/            # Main app screens
│   ├── TodayScreen.tsx
│   ├── WorkoutsScreen.tsx
│   ├── NutritionScreen.tsx
│   └── ProfileScreen.tsx
├── components/         # Reusable UI components
│   ├── Card.tsx
│   └── ProgressBar.tsx
├── navigation/         # Navigation setup
│   └── AppNavigator.tsx
└── utils/             # Utilities and helpers
    └── sampleData.ts
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

## Features

### Phase 1 (Completed MVP)

- ✅ **Dark mode UI** - Modern dark theme throughout the entire app
- ✅ **Log workouts** - Interactive modal to add exercises with sets, reps, and weight
  - Add multiple exercises per workout
  - Track sets, reps, weight, and optional RPE
  - View workout history sorted by date
- ✅ **Log meals** - Quick meal entry with nutrition tracking
  - Track calories and macros (protein, carbs, fats)
  - Daily calorie target with progress bar
  - View all meals for the day
- ✅ **Update steps** - Manual step entry with bottom sheet modal
  - Daily step goal tracking with progress bar
  - Quick update from Today screen
- ✅ **Unified daily view** - See everything at a glance
  - Today's workout status
  - Calorie progress vs target
  - Step progress vs goal
  - Pull to refresh
- ✅ **User profile & settings**
  - Edit daily calorie target
  - Edit daily step goal
  - Toggle weight units (lbs ↔ kg)
  - Sample data generator for testing
  - Reset all data option

### Phase 2 (Planned)

- Workout templates/routines
- Saved meals (reusable)
- Exercise progression charts
- Weekly/monthly summary
- Step API integration (HealthKit/Google Fit)

### Phase 3 (Future)

- User accounts + authentication
- Cloud sync
- Multi-device support
- Export data
- Body weight tracking

## Data Models

### Core Entities

- **User**: Profile with daily calorie target and step goal
- **WorkoutLog**: Individual workout session with exercises
- **ExerciseLog**: Exercise within a workout (sets, reps, weight)
- **DailyNutrition**: Daily meal tracking with calorie target
- **Meal**: Individual meal entry with macros
- **DailySteps**: Daily step count and goal

All data is stored locally using AsyncStorage for a fast, offline-first experience.

## Usage

### Today Screen

The main dashboard showing:
- Current date
- Today's workout (or option to log)
- Calorie progress (consumed vs target)
- Step progress (current vs goal)

Pull down to refresh data.

### Workouts Screen

- View workout history (sorted by date)
- Tap workout to see details
- FAB button to log new workout (future feature)

### Nutrition Screen

- Daily calorie summary with progress
- Macro breakdown (protein, carbs, fats)
- List of logged meals
- FAB button to add meal (future feature)

### Profile Screen

- Edit name
- Edit daily calorie target
- Edit daily step goal
- View app info
- Reset all data (danger zone)

## Development

### Adding Sample Data

To test the app with sample data, you can import and call the `createSampleData` function:

```typescript
import { createSampleData } from './src/utils/sampleData';

// Call this from a button or during development
await createSampleData();
```

This will create:
- 3 sample workouts (today, yesterday, 2 days ago)
- Nutrition data with meals
- Step count data

### Key Files to Modify

- **Add a new screen**: Create in `src/screens/` and add to `AppNavigator.tsx`
- **Add data models**: Update `src/types/index.ts`
- **Add storage functions**: Update `src/services/storage.ts`
- **Add reusable components**: Create in `src/components/`

## Design Decisions

### Local-First Architecture

The app uses AsyncStorage for local data persistence without requiring a backend or authentication. This provides:

- **Fast performance**: No network latency
- **Offline-first**: Works without internet
- **Simple MVP**: No backend setup required
- **Easy to extend**: Cloud sync can be added later

### Bottom Tab Navigation

Four main tabs provide quick access to all features:
1. **Today**: Daily overview
2. **Workouts**: Exercise tracking
3. **Nutrition**: Calorie & macro tracking
4. **Profile**: Settings and preferences

### Minimal UI

Clean, card-based interface with:
- Progress bars for visual feedback
- Consistent color coding (blue for workouts, red for nutrition, green for steps)
- FAB buttons for primary actions
- Native iOS-style icons

## Future Enhancements

### Workout Logging Flow (Phase 2)

1. Start workout → Enter name
2. Add exercises (search from history or enter new)
3. For each exercise:
   - See previous performance
   - Log sets with reps/weight/RPE
4. Complete and save

### Meal Logging Flow (Phase 2)

1. Add meal → Enter name
2. Input calories + macros
3. Option to save as reusable meal
4. Save to today's log

### Cloud Sync (Phase 3)

- User authentication (email/password or social)
- REST API backend (Node.js + PostgreSQL)
- Sync local data to cloud
- Conflict resolution for multi-device

## Troubleshooting

### Clear App Data

If you need to reset the app:
1. Go to Profile tab
2. Scroll to "Danger Zone"
3. Tap "Reset All Data"
4. Restart the app

### Common Issues

- **App won't load**: Check that dependencies are installed (`npm install`)
- **Data not persisting**: AsyncStorage may need permissions on some devices
- **Navigation issues**: Make sure all screens are properly imported in AppNavigator

## License

This is a personal project for demonstration purposes.

## Future Enhancements

Potential features for future development:

1. **Workout detail view** - View and edit past workouts with full exercise history
2. **Exercise progression charts** - Visual graphs showing weight and rep progress over time
3. **Workout templates** - Save and reuse favorite workout routines
4. **Saved meals** - Quick-add frequently eaten meals
5. **Weekly/monthly summaries** - Aggregate view of fitness progress
6. **HealthKit/Google Fit integration** - Automatic step syncing from device sensors
7. **Cloud sync** - Backup data and sync across multiple devices
8. **Body weight tracking** - Track weight changes over time
9. **Export functionality** - Export workout and nutrition data to CSV

---

Built with React Native + Expo
