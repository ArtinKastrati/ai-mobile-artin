import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reloadAppAsync } from 'expo';

function ErrorFallback() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>The app encountered an unexpected error.</Text>
      <TouchableOpacity style={styles.button} onPress={() => reloadAppAsync()}>
        <Text style={styles.buttonText}>Restart App</Text>
      </TouchableOpacity>
    </View>
  );
}

type State = { hasError: boolean };
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    padding: 32,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
