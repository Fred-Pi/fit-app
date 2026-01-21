# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Today   │  │ Workouts │  │ Nutrition│  │Profile │ │
│  │  Screen  │  │  Screen  │  │  Screen  │  │ Screen │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │             │              │             │      │
│       └─────────────┴──────────────┴─────────────┘      │
│                          │                              │
│                  ┌───────▼────────┐                     │
│                  │  Zustand Stores │                    │
│                  │  (stores/)      │                    │
│                  └───────┬────────┘                     │
│                          │                              │
│                  ┌───────▼────────┐                     │
│                  │  Storage Layer │                     │
│                  │  (services/)   │                     │
│                  └───────┬────────┘                     │
│                          │                              │
│                  ┌───────▼────────┐                     │
│                  │     SQLite     │                     │
│                  │  (Local Data)  │                     │
│                  └────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Flow
```
Screen Component
    ↓
Zustand Store (useWorkoutStore, useNutritionStore, etc.)
    ↓
Store Action (fetchWorkouts, fetchNutrition)
    ↓
Storage Service (getWorkouts, getNutrition, etc.)
    ↓
SQLite Database (indexed queries)
    ↓
TypeScript Types (typed data)
    ↓
Store State (cached)
    ↓
Screen Component (render via subscription)
```

### Write Flow
```
User Action (button press, form submit)
    ↓
Screen Component (gather data)
    ↓
Zustand Store Action (addWorkout, saveMeal, etc.)
    ↓
Storage Service (saveWorkout, saveNutrition, etc.)
    ↓
SQLite Database (persist)
    ↓
Store State (update cache)
    ↓
Screen Component (auto re-render via subscription)
```

## Layer Responsibilities

### 1. Screens (`src/screens/`)

**Responsibility**: User interface and user interaction

- Render UI components
- Handle user input
- Manage local component state (UI state)
- Call storage services for data operations
- Use React hooks (useState, useEffect, useFocusEffect)

**Example**: `TodayScreen.tsx`
- Loads today's workout, nutrition, and steps on mount
- Displays data using Card and ProgressBar components
- Refreshes data when screen gains focus

### 2. Components (`src/components/`)

**Responsibility**: Reusable UI elements

- Pure, presentational components
- Accept props for data and configuration
- No direct data fetching
- Stateless where possible

**Example**: `ProgressBar.tsx`
- Accepts current value and target
- Calculates percentage
- Renders visual progress bar
- Color changes when over target

### 3. Navigation (`src/navigation/`)

**Responsibility**: App navigation structure

- Define navigation hierarchy
- Configure tab bar
- Set up screen options
- Handle deep linking (future)

**Example**: `AppNavigator.tsx`
- Bottom tab navigator with 4 tabs
- Icon and color configuration
- Header styling

### 4. Stores (`src/stores/`)

**Responsibility**: Centralized state management

- Manage application state with Zustand
- Provide cached data to components
- Handle data fetching and mutations
- Coordinate modal visibility

**Example**: `workoutStore.ts`
- Caches workout data (5-minute TTL)
- Provides actions: fetchWorkouts, addWorkout, deleteWorkout
- Computes derived state: streaks, recent workouts
- Manages templates and personal records

### 5. Services (`src/services/`)

**Responsibility**: Data access layer

- Interact with SQLite database
- Provide type-safe data operations
- Handle data transformation
- Manage data relationships and migrations

**Example**: `storage.ts`
- CRUD operations for all entities
- SQL query building
- Data serialization/deserialization

**Example**: `database.ts`
- Database initialization
- Schema management
- Migration from AsyncStorage (legacy)

### 6. Types (`src/types/`)

**Responsibility**: Type definitions and data contracts

- Define data models
- Ensure type safety across app
- Document data structure
- Interface definitions

**Example**: `index.ts`
- User, WorkoutLog, DailyNutrition, etc.
- Shared interfaces used throughout app

### 7. Utils (`src/utils/`)

**Responsibility**: Helper functions and utilities

- Sample data generation
- Date manipulation
- Formatters and validators

**Example**: `sampleData.ts`
- Creates realistic test data
- Useful for development and demos

## State Management Strategy

### Current Approach: Zustand Stores

The app uses Zustand for centralized state management with 5 domain-specific stores:

```typescript
// Selective subscription - only re-renders when specific value changes
const user = useUserStore((s) => s.user);
const workouts = useWorkoutStore((s) => s.workouts);
const isLoading = useWorkoutStore((s) => s.isLoading);

// Store actions
const addWorkout = useWorkoutStore((s) => s.addWorkout);
const openAddMeal = useUIStore((s) => s.openAddMeal);
```

### Store Architecture

| Store | Purpose | Key State |
|-------|---------|-----------|
| `userStore` | User profile & preferences | `user`, `isInitialized` |
| `workoutStore` | Workouts, templates, PRs | `workouts`, `templates`, `personalRecords`, `streaks` |
| `nutritionStore` | Daily nutrition & meals | `todayNutrition`, computed totals |
| `dailyTrackingStore` | Steps & weight | `todaySteps`, `todayWeight`, `weeklyStats` |
| `uiStore` | Modal state | `activeModal`, `editData`, `confirmDialog` |

### When Data Updates

1. **On mount** (`useEffect`): Stores fetch initial data
2. **On focus** (`useFocusEffect`): Refresh from store (uses cache if fresh)
3. **After mutations**: Store actions update cache automatically
4. **Pull to refresh**: Force refresh bypasses cache
5. **Cache duration**: 5 minutes for workout data

### Benefits of Zustand

- **No boilerplate**: Simple API without reducers or actions
- **Selective subscriptions**: Fine-grained re-renders
- **Built-in caching**: Stores maintain data between screen navigations
- **Centralized modals**: UI store manages all modal visibility
- **TypeScript support**: Full type inference

## Storage Strategy

### Current: SQLite (Local-First)

**Advantages**:
- Fast indexed queries
- Works offline
- Relational data with foreign keys
- No backend required
- No authentication needed
- Proper data integrity

**Database Schema**:
```
users                  → User profile
workout_logs           → Workout sessions
exercise_logs          → Exercises in workouts (FK → workout_logs)
set_logs               → Sets in exercises (FK → exercise_logs)
daily_nutrition        → Daily nutrition records
meals                  → Individual meals (FK → daily_nutrition)
daily_steps            → Step tracking
daily_weights          → Weight tracking
personal_records       → PR tracking
workout_templates      → Saved templates
exercise_templates     → Exercises in templates
custom_exercises       → User-created exercises
achievements           → Achievement progress
```

**Indexes**:
- Date-based lookups (user_id, date) on all daily tables
- Exercise lookups for PRs
- Foreign key indexes for nested data

### Web Platform Support

SQLite is not available on web, so the app uses a metro config shim:
- Native platforms: Full SQLite support
- Web: Graceful fallback (limited functionality)

### Future: Hybrid Approach

Add cloud sync while keeping local-first benefits:

```
┌─────────────┐         ┌─────────────┐
│   SQLite    │ ←sync→  │   Backend   │
│  (Local)    │         │  (Cloud)    │
└─────────────┘         └─────────────┘
```

Benefits:
- Fast local reads/writes
- Background sync to cloud
- Multi-device support
- Offline-first, online-enabled

## Navigation Architecture

### Tab Navigation (Current)

```
Root Navigator (Bottom Tabs)
├── Today Tab → TodayScreen
├── Workouts Tab → WorkoutsScreen
├── Nutrition Tab → NutritionScreen
└── Profile Tab → ProfileScreen
```

### Future: Stack Navigation (Phase 2+)

```
Root Navigator (Bottom Tabs)
├── Today Tab → Today Stack
│   ├── TodayScreen
│   └── WorkoutDetailScreen
├── Workouts Tab → Workouts Stack
│   ├── WorkoutsScreen
│   ├── WorkoutDetailScreen
│   └── LogWorkoutScreen
├── Nutrition Tab → Nutrition Stack
│   ├── NutritionScreen
│   └── AddMealScreen
└── Profile Tab → ProfileScreen
```

## Data Relationships

### Entity Relationships

```
User
  ├─→ WorkoutLog[] (one-to-many)
  ├─→ DailyNutrition[] (one-to-many)
  └─→ DailySteps[] (one-to-many)

WorkoutLog
  └─→ ExerciseLog[] (one-to-many)

ExerciseLog
  └─→ SetLog[] (one-to-many)

DailyNutrition
  └─→ Meal[] (one-to-many)
```

### Data Access Patterns

**By Date (Common)**:
- `getWorkoutsByDate(date)` → WorkoutLog[]
- `getNutritionByDate(date)` → DailyNutrition | null
- `getStepsByDate(date)` → DailySteps | null

**By ID**:
- Find by filtering arrays
- Future: Add index/cache for fast lookup

**All Records**:
- `getWorkouts()` → WorkoutLog[]
- `getNutrition()` → DailyNutrition[]
- `getSteps()` → DailySteps[]

## Performance Considerations

### Current Optimizations

1. **Data Loading**: Only load what's needed
   - Today screen: Only today's data
   - History screens: All data but filtered/sorted

2. **Rendering**: Use FlatList for long lists
   - Virtualization for workout/meal history
   - Key extraction for efficient updates

3. **Refresh Control**: User-initiated refresh
   - Pull to refresh on scrollable screens
   - Auto-refresh on focus

### Future Optimizations

1. **Pagination**: Load history in chunks
2. **Caching**: In-memory cache for frequently accessed data
3. **Indexing**: Date-based index for fast lookups
4. **Memoization**: React.memo for expensive components

## Error Handling

### Current Approach

```typescript
try {
  const data = await getWorkouts();
  setWorkouts(data);
} catch (error) {
  console.error('Error loading workouts:', error);
  // Graceful degradation: show empty state
}
```

### Future Enhancements

- User-facing error messages
- Retry logic for failed operations
- Error boundaries for component crashes
- Logging/monitoring service

## Testing Strategy (Future)

### Unit Tests
- Storage service functions
- Utility functions
- Data transformations

### Component Tests
- Component rendering
- User interactions
- Props handling

### Integration Tests
- Screen flows
- Navigation
- Data persistence

### E2E Tests
- Critical user paths
- Workout logging flow
- Meal logging flow

## Security Considerations

### Current (MVP)
- No authentication required
- Local data only
- No sensitive data transmission

### Future (Phase 3)
- User authentication (JWT)
- HTTPS for all API calls
- Data encryption at rest
- Secure token storage
- Input validation and sanitization

## Scalability Path

### Phase 1 → Phase 2
- Add workout/meal templates
- Add charts and analytics
- Add health API integrations
- Remain local-first

### Phase 2 → Phase 3
- Add backend (Node.js + PostgreSQL)
- Add user authentication
- Implement sync service
- Add web dashboard

### Phase 3+
- Social features (optional)
- Trainer/coach accounts
- Data export/import
- Advanced analytics

## Key Design Patterns

1. **Local-First**: SQLite for fast, offline data access
2. **Centralized State**: Zustand stores for all app state
3. **Selective Subscriptions**: Components subscribe to specific state slices
4. **Type Safety**: TypeScript for all data and store interfaces
5. **Separation of Concerns**: Screens → Stores → Services → Database
6. **Component Composition**: Reusable UI components
7. **Centralized Modals**: All modals rendered at root via GlobalModals
8. **Caching**: Store-level caching to prevent redundant queries

## Development Guidelines

### Adding a New Feature

1. **Define types** in `src/types/index.ts`
2. **Add storage functions** in `src/services/storage.ts`
3. **Create/update screens** in `src/screens/`
4. **Add reusable components** if needed
5. **Update navigation** if adding new screens
6. **Test thoroughly** with sample data

### Code Style

- Use TypeScript for type safety
- Functional components with hooks
- Async/await for asynchronous operations
- Descriptive variable names
- Comments for complex logic

---

This architecture supports the MVP while being extensible for future phases.
