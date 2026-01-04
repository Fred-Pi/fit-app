# Quick Start Guide

Get the fitness tracking app running in 5 minutes.

## Prerequisites

Install these first if you haven't:
- [Node.js](https://nodejs.org/) (v16+)
- [Expo Go app](https://expo.dev/client) on your phone

## Steps

### 1. Navigate to the project directory

```bash
cd fit-app-mobile
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

This will:
- Start the Metro bundler
- Display a QR code in your terminal
- Open Expo DevTools in your browser

### 4. Open on your phone

**iOS**:
1. Open the Camera app
2. Point at the QR code
3. Tap the notification to open in Expo Go

**Android**:
1. Open the Expo Go app
2. Tap "Scan QR code"
3. Point at the QR code

### 5. Test the app

The app will load with:
- Empty Today screen (no workouts/meals/steps yet)
- Empty Workouts screen
- Empty Nutrition screen
- Profile screen with default settings

## Add Sample Data (Optional)

To test the app with realistic data:

1. Go to the **Profile** screen (tap Profile tab)
2. In your code editor, open `src/screens/ProfileScreen.tsx`
3. Add this import at the top:
   ```typescript
   import { createSampleData } from '../utils/sampleData';
   ```
4. Add a button in the Profile screen (after the "About" card):
   ```typescript
   <Card>
     <TouchableOpacity
       style={styles.dangerButton}
       onPress={async () => {
         await createSampleData();
         Alert.alert('Success', 'Sample data added! Go to Today screen.');
       }}
     >
       <Text style={styles.dangerButtonText}>Add Sample Data</Text>
     </TouchableOpacity>
   </Card>
   ```
5. Save the file (app will reload automatically)
6. Tap "Add Sample Data" button
7. Navigate to Today tab to see the data

This will create:
- 3 workouts (today, yesterday, 2 days ago)
- Meals for today and yesterday
- Step counts for 3 days

## Common Commands

```bash
# Start development server
npm start

# Run on iOS simulator (requires macOS)
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web

# Clear cache and restart
npm start --clear
```

## Troubleshooting

### App won't load
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start --clear
```

### QR code not working
- Make sure your phone and computer are on the same WiFi network
- Try the "Tunnel" connection mode in Expo DevTools
- Or manually enter the URL shown in Expo Go app

### Changes not reflecting
- Shake your phone and tap "Reload"
- Or press `r` in the terminal where Metro is running

## Next Steps

1. Explore the **Today** screen - your daily fitness dashboard
2. Check **Workouts** - view your workout history
3. Check **Nutrition** - see your daily calorie and macro tracking
4. Visit **Profile** - adjust your daily targets

## Development

To start building features:
1. Read `ARCHITECTURE.md` for system design
2. Read `README.md` for detailed documentation
3. Start with screens in `src/screens/`
4. Add reusable components in `src/components/`

## Need Help?

- Check the README.md for full documentation
- Check the ARCHITECTURE.md for technical details
- Review the code comments for inline explanations

---

Happy coding!
