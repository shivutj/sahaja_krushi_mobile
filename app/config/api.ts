import Constants from 'expo-constants';
import { Platform } from 'react-native';

function deriveLanIpFromDebuggerHost(): string | null {
  try {
    const host = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
    if (!host || typeof host !== 'string') return null;
    const ip = host.split(':')[0];
    if (!ip) return null;
    return ip;
  } catch {
    return null;
  }
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // Android emulator special hostname
  if (Platform.OS === 'android') {
    // If running on emulator, prefer 10.0.2.2; on device, prefer LAN IP
    const lan = deriveLanIpFromDebuggerHost();
    console.log('Android - LAN IP detected:', lan);
    if (lan && lan !== 'localhost') {
      const url = `http://${lan}:3000`;
      console.log('Using LAN IP for Android:', url);
      return url;
    }
    const url = 'http://10.0.2.2:3000';
    console.log('Using emulator IP for Android:', url);
    return url;
  }

  // iOS simulator or device: prefer LAN IP if available
  const lan = deriveLanIpFromDebuggerHost();
  console.log('iOS - LAN IP detected:', lan);
  if (lan && lan !== 'localhost') {
    const url = `http://${lan}:3000`;
    console.log('Using LAN IP for iOS:', url);
    return url;
  }

  // Fallback
  const url = 'http://localhost:3000';
  console.log('Using localhost fallback:', url);
  return url;
}

export const API_V1 = `${getApiBaseUrl()}/api/V1`;
export const FARMERS_BASE = `${API_V1}/farmers`;
export const NEWS_BASE = `${API_V1}/news`;
export const QUERIES_BASE = `${API_V1}/queries`;
export const CROP_REPORTS_BASE = `${API_V1}/crop-reports`;



