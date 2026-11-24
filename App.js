import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import useStore from './src/store/useStore';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';

// Catches unexpected render errors so the app shows a recovery screen instead of crashing.
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Unhandled UI error', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090B', padding: 24 }}>
        <Text style={{ color: '#FAFAFA', fontSize: 18, textAlign: 'center', marginBottom: 16 }}>Something went wrong.</Text>
        <TouchableOpacity onPress={() => this.setState({ failed: false })} accessibilityRole="button">
          <Text style={{ color: '#F43F5E', fontSize: 16 }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default function App() {
  const theme = useStore((s) => s.theme);
  const [fontsLoaded] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold });
  if (!fontsLoaded) return null;
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
