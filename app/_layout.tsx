import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { AuthProvider } from '../src/components/auth/AuthProvider';

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1a1a2e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              contentStyle: {
                backgroundColor: '#0f0f1a',
              },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="project/[id]"
              options={{
                title: 'Project Details',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="project/new"
              options={{
                title: 'New Project',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="project/edit/[id]"
              options={{
                title: 'Edit Project',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="mission/active"
              options={{
                title: 'Active Mission',
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="mission/[id]"
              options={{
                title: 'Mission Details',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="property/index"
              options={{
                title: 'Properties',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="property/[id]"
              options={{
                title: 'Property Details',
                presentation: 'card',
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
