import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import api from '../lib/api';
import { storeAuth, useAuth } from '../lib/auth';

export default function LoginScreen() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (data.user.role !== 'worker') {
        setError('This app is for field workers only. Use the web dashboard instead.');
        setLoading(false);
        return;
      }
      await storeAuth(data.token, data.user);
      setUser(data.user);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Insta Fumigation</Text>
      <Text style={styles.tagline}>Because We Can!</Text>
      <Text style={styles.subtitle}>Sign in to view your jobs</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4f6f8' },
  logo: { width: 200, height: 176, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#012c7f', textAlign: 'center' },
  tagline: {
    fontSize: 14, fontWeight: '600', fontStyle: 'italic',
    color: '#cd0412', textAlign: 'center', marginTop: 2,
  },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 6, marginBottom: 24 },
  error: {
    color: '#b91c1c', backgroundColor: '#fee2e2', padding: 10, borderRadius: 8,
    marginBottom: 12, fontSize: 13, textAlign: 'center',
  },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, marginBottom: 12, backgroundColor: '#fff', color: '#111827',
  },
  button: {
    backgroundColor: '#012c7f', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
