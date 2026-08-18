import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthContext, AuthUser, getStoredUser } from './src/lib/auth';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then((stored) => {
      setUser(stored);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#012c7f" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {/* Navy brand header once signed in, light login screen before that. */}
      <StatusBar style={user ? 'light' : 'dark'} />
      {user ? <AppNavigator /> : <LoginScreen />}
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' },
});
