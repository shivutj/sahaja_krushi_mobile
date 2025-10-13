import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <PaperProvider>
      <StatusBar style="auto" />
      <Stack initialRouteName="index">
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Farmer Login',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="home" 
          options={{ 
            title: 'Farmer App',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="upload" 
          options={{ 
            title: 'Upload Crop Query',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="news" 
          options={{ 
            title: 'News',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="knowledge" 
          options={{ 
            title: 'Knowledge Base',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="crop-reports" 
          options={{ 
            title: 'Crop Reports',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="create-crop-report" 
          options={{ 
            title: 'Create Crop Report',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="create-crop-report-simple" 
          options={{ 
            title: 'Create Crop Report (Simple)',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="crop-report-detail" 
          options={{ 
            title: 'Crop Report Detail',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="sahaja-details" 
          options={{ 
            title: 'Sahaja Krushi Details',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="history" 
          options={{ 
            title: 'History',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="query/QueryById" 
          options={{ 
            title: 'Query Details',
            headerShown: true 
          }} 
        />
      </Stack>
    </PaperProvider>
  );
}
