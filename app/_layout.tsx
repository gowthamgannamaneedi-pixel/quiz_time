import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { parseQuizURL } from '../src/utils/deepLink';
import { quizStore } from '../src/store/quizStore';
import { realtimeSession } from '../src/services/realtimeSession';
import { theme } from '../src/theme/colors';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    realtimeSession.connect();

    const processIncomingURL = (rawUrl: string) => {
      if (!rawUrl) return;
      const parsed = parseQuizURL(rawUrl);

      const activeQuiz = quizStore.getQuiz();
      const targetId = parsed.quizId || activeQuiz.id;
      const pinParam = parsed.pin ? `?pin=${parsed.pin}` : '';

      if (parsed.isValid) {
        router.push(`/join/${encodeURIComponent(targetId)}${pinParam}` as any);
      }
    };

    const handleUrl = (event: { url: string }) => {
      processIncomingURL(event.url);
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        processIncomingURL(url);
      }
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.brandBackground },
          animation: 'slide_from_right',
        }}
      >
        {/* Start / Selection Screen */}
        <Stack.Screen name="index" />

        {/* Universal Join Link Route */}
        <Stack.Screen name="join/[quizId]" />

        {/* Admin Flow */}
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="admin/quiz-settings" />
        <Stack.Screen name="admin/questions" />
        <Stack.Screen name="admin/timer" />
        <Stack.Screen name="admin/qr" />
        <Stack.Screen name="admin/preview" />

        {/* Student Flow */}
        <Stack.Screen name="student/index" />
        <Stack.Screen name="student/scan" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="student/ready" />
        <Stack.Screen name="student/quiz" />
        <Stack.Screen name="student/result" />
      </Stack>
    </SafeAreaProvider>
  );
}
