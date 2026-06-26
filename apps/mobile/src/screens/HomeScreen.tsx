import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then((res) => res.json())
      .then(() => setStatus('connected'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lankit Mobile</Text>
      <Text style={styles.subtitle}>React Native App</Text>

      {status === 'loading' && <ActivityIndicator size="small" />}
      {status === 'error' && <Text style={styles.error}>BFF 未连接</Text>}
      {status === 'connected' && <Text style={styles.success}>BFF 已连接 ✓</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
  },
  success: {
    color: '#22c55e',
    fontSize: 14,
  },
});
