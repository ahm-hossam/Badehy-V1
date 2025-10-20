import { Redirect } from 'expo-router';

export default function Index() {
  const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
  return token ? <Redirect href="/(tabs)/home" /> : <Redirect href="/login" />;
}


