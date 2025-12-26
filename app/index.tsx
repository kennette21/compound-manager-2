import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { session, isLoading } = useAuthStore();

  // Show nothing while checking auth state
  if (isLoading) {
    return null;
  }

  // Redirect based on auth state
  if (session) {
    return <Redirect href="/(tabs)/map" />;
  }

  return <Redirect href="/(auth)/login" />;
}
