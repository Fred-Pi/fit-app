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
│                  │  Storage Layer │                     │
│                  │  (services/)   │                     │
│                  └───────┬────────┘                     │
│                          │                              │
│                  ┌───────▼────────┐                     │
│                  │  AsyncStorage  │                     │
│                  │  (Local Data)  │                     │
│                  └────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Flow
```
Screen Component
    ↓
Storage Service (getWorkouts, getNutrition, etc.)
    ↓
AsyncStorage (JSON data)
    ↓
TypeScript Types (typed data)
    ↓
Screen Component (render)
```

### Write Flow
```
User Action (button press, form submit)
    ↓
Screen Component (gather data)
    ↓
Storage Service (saveWorkout, saveNutrition, etc.)
    ↓
AsyncStorage (persist JSON)
    ↓
Screen Component (refresh/reload)
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

### 4. Services (`src/services/`)

**Responsibility**: Data access and business logic

- Interact with AsyncStorage
- Provide type-safe data operations
- Handle data transformation
- Manage data relationships

**Example**: `storage.ts`
- CRUD operations for all entities
- ID generation
- Date formatting
- Data initialization

### 5. Types (`src/types/`)

**Responsibility**: Type definitions and data contracts

- Define data models
- Ensure type safety across app
- Document data structure
- Interface definitions

**Example**: `index.ts`
- User, WorkoutLog, DailyNutrition, etc.
- Shared interfaces used throughout app

### 6. Utils (`src/utils/`)

**Responsibility**: Helper functions and utilities

- Sample data generation
- Date manipulation
- Formatters and validators

**Example**: `sampleData.ts`
- Creates realistic test data
- Useful for development and demos

## State Management Strategy

### Current Approach: Local Component State

Each screen manages its own state using React hooks:

```typescript
const [user, setUser] = useState<User | null>(null);
const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
const [loading, setLoading] = useState(true);
```

### When to Reload Data

1. **On mount** (`useEffect`): Initial load
2. **On focus** (`useFocusEffect`): When tab becomes active
3. **After mutations**: After creating/updating/deleting data
4. **Pull to refresh**: User-initiated refresh

### Future: Context or State Management

When app grows, consider:
- React Context for global state (user, settings)
- React Query for server sync (Phase 3)
- Redux/Zustand if complexity increases

## Storage Strategy

### Current: AsyncStorage (Local-First)

**Advantages**:
- Fast (no network latency)
- Works offline
- Simple API
- No backend required
- No authentication needed

**Limitations**:
- Data stays on device
- No multi-device sync
- Limited to ~6MB (iOS)
- No server-side backup

**Data Structure**:
```
@fit_app_user         → User object (JSON)
@fit_app_workouts     → WorkoutLog[] (JSON array)
@fit_app_nutrition    → DailyNutrition[] (JSON array)
@fit_app_steps        → DailySteps[] (JSON array)
```

### Future: Hybrid Approach (Phase 3)

Add cloud sync while keeping local-first benefits:

```
┌─────────────┐         ┌─────────────┐
│AsyncStorage │ ←sync→  │   Backend   │
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

1. **Local-First**: Data stored locally, sync later
2. **Type Safety**: TypeScript for all data
3. **Separation of Concerns**: Screens, services, types
4. **Component Composition**: Reusable UI components
5. **Pull-Based Refresh**: User controls data updates

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
