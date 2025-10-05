import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ImageBackground, Animated, TouchableOpacity, useWindowDimensions, Pressable, ActivityIndicator } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import DateTimePicker, { AndroidEvent } from '@react-native-community/datetimepicker';
import { FARMERS_BASE } from './config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optimized login screen with better performance
export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isTablet = width > 600;
  const theme = useTheme();
  
  // State management
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Error states
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [loginError, setLoginError] = useState('');

  // Optimized animations - only essential ones
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const BASE_URL = FARMERS_BASE;

  // Optimized animation - single entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600, // Reduced duration
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Memoized functions for better performance
  const normalizeDob = useCallback((value: string) => {
    const v = value.trim();
    const m = v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
    if (m) {
      return `${m[3]}-${m[2]}-${m[1]}`;
    }
    return v;
  }, []);

  const formatDate = useCallback((d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const onPressOpenPicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const onChangeDate = useCallback((event: AndroidEvent | any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        setDob(formatDate(date));
      }
      setShowDatePicker(false);
    } else {
      if (date) {
        setSelectedDate(date);
        setDob(formatDate(date));
      }
    }
  }, [formatDate]);

  // Optimized login with better error handling and loading states
  const handleLogin = useCallback(async () => {
    setPhoneError('');
    setDobError('');
    setLoginError('');
    
    const phone = phoneNumber.replace(/\D/g, '').slice(0, 10).trim();
    const dobNormalized = normalizeDob(dob);

    let failed = false;

    if (!phone) {
      setPhoneError('Please enter Phone Number\nದಯವಿಟ್ಟು ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ');
      failed = true;
    } else if (phone.length !== 10) {
      setPhoneError('Enter a valid Phone Number');
      failed = true;
    }

    if (!dobNormalized) {
      setDobError('Please enter Date of Birth (YYYY-MM-DD)');
      failed = true;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dobNormalized)) {
      setDobError('Enter DOB as YYYY-MM-DD or DD/MM/YYYY');
      failed = true;
    }

    if (failed) {
      Alert.alert('Input Error', 'Please fix the highlighted errors.');
      return;
    }

    setIsLoggingIn(true);
    try {
      // Add timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await axios.post(`${BASE_URL}/login`, 
        { contactNumber: phone, dateOfBirth: dobNormalized },
        { 
          signal: controller.signal,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      const payload = res?.data?.data ?? res?.data ?? { contactNumber: phone };
      await AsyncStorage.setItem('farmerSession', JSON.stringify(payload));
      router.replace('/home');
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setLoginError('Request timed out. Please check your internet connection.');
      } else if (e.code === 'NETWORK_ERROR') {
        setLoginError('Network error. Please check your internet connection.');
      } else {
        setLoginError('Login failed. Please check your credentials.');
      }
      Alert.alert('Error', 'Login failed. Please check your credentials and internet connection.');
    } finally {
      setIsLoggingIn(false);
    }
  }, [phoneNumber, dob, normalizeDob, BASE_URL]);

  // Memoized responsive styles
  const responsiveStyles = useMemo(() => ({
    logoSize: isSmallScreen ? 80 : isTablet ? 120 : 100,
    titleSize: isSmallScreen ? 26 : isTablet ? 42 : 32,
    subtitleSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    cardPadding: isSmallScreen ? 20 : isTablet ? 36 : 24,
    buttonHeight: isSmallScreen ? 52 : isTablet ? 60 : 56,
  }), [isSmallScreen, isTablet]);

  const styles = useMemo(() => getStyles(isSmallScreen, isTablet, width, height), [isSmallScreen, isTablet, width, height]);

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" />

      {/* Optimized background - using local gradient instead of external image */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C', '#4CAF50']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <Animated.ScrollView 
              contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
              showsVerticalScrollIndicator={false}
              style={{ 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Simplified Header */}
              <Animated.View style={styles.header}>
                <View style={[styles.logoContainer, { 
                  width: responsiveStyles.logoSize, 
                  height: responsiveStyles.logoSize,
                  borderRadius: responsiveStyles.logoSize / 2,
                }]}>
                  <LinearGradient
                    colors={['#1B5E20', '#2E7D32', '#388E3C', '#4CAF50']}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons 
                      name="agriculture" 
                      size={responsiveStyles.logoSize * 0.55} 
                      color="white" 
                    />
                  </LinearGradient>
                </View>
                
                <Text style={[
                  styles.officialTitle, 
                  { fontSize: responsiveStyles.titleSize }
                ]}>
                  ಸಹಜ ಕೃಷಿ
                </Text>
                <Text style={styles.departmentText}>
                  Department of Agriculture • ಕೃಷಿ ಇಲಾಖೆ
                </Text>
              </Animated.View>

              {/* Optimized Login Form */}
              <Animated.View style={[
                styles.formContainer, 
                isTablet && styles.tabletForm,
                { transform: [{ translateY: slideAnim }] }
              ]}>
                <Card style={styles.loginCard}>
                  <View style={[styles.cardContent, { padding: responsiveStyles.cardPadding }]}>
                    <View style={styles.formHeader}>
                      <View style={styles.headerIconContainer}>
                        <LinearGradient
                          colors={['#FF8F00', '#FFA000']}
                          style={styles.headerIcon}
                        >
                          <MaterialIcons name="login" size={24} color="white" />
                        </LinearGradient>
                      </View>
                      <Text style={styles.formSubtitle}>ಮೊಬೈಲ್ + ಜನ್ಮ ದಿನಾಂಕ ಲಾಗಿನ್</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        mode="outlined"
                        label="Phone Number / ಫೋನ್ ಸಂಖ್ಯೆ"
                        value={phoneNumber}
                        onChangeText={text => {
                          const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(digitsOnly);
                          setPhoneError('');
                          setLoginError('');
                        }}
                        style={[styles.input, { color: 'black' }]}
                        left={<TextInput.Icon icon="phone"/>}
                        placeholder="10-digit mobile number"
                        keyboardType="number-pad"
                        outlineColor="rgba(46, 125, 50, 0.3)"
                        activeOutlineColor="#388E3C"
                        error={!!phoneError}
                        theme={{ 
                          colors: { 
                            text: 'black',
                            primary: '#388E3C',
                            outline: 'rgba(46, 125, 50, 0.3)',
                          } 
                        }}
                        maxLength={10}
                      />
                      {phoneError ? (
                        <View style={styles.errorContainer}>
                          <MaterialIcons name="error" size={16} color="#f44336" />
                          <Text style={styles.errorText}>{phoneError}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        mode="outlined"
                        label="Date of Birth (YYYY-MM-DD or DD/MM/YYYY)"
                        value={dob}
                        onChangeText={v => { setDob(v); setDobError(''); setLoginError(''); }}
                        style={[styles.input, { color: 'black' }]}
                        left={<TextInput.Icon icon="calendar" onPress={onPressOpenPicker} />}
                        placeholder="Type date or tap calendar"
                        outlineColor="rgba(46, 125, 50, 0.3)"
                        activeOutlineColor="#388E3C"
                        error={!!dobError}
                        theme={{ 
                          colors: { 
                            text: 'black',
                            primary: '#388E3C',
                            outline: 'rgba(46, 125, 50, 0.3)',
                          } 
                        }}
                        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                        editable={true}
                      />
                      {showDatePicker && (
                        <DateTimePicker
                          value={selectedDate ?? new Date(1990, 0, 1)}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          maximumDate={new Date()}
                          onChange={onChangeDate}
                        />
                      )}
                      {dobError ? (
                        <View style={styles.errorContainer}>
                          <MaterialIcons name="error" size={16} color="#f44336" />
                          <Text style={styles.errorText}>{dobError}</Text>
                        </View>
                      ) : null}
                    </View>

                    <TouchableOpacity 
                      onPress={handleLogin} 
                      disabled={isLoggingIn}
                      style={styles.loginButtonContainer}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={isLoggingIn 
                          ? ['#A5D6A7', '#C8E6C9', '#E8F5E8'] 
                          : ['#1B5E20', '#2E7D32', '#388E3C', '#4CAF50']
                        }
                        style={[styles.loginButton, { height: responsiveStyles.buttonHeight }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.buttonContent}>
                          {isLoggingIn ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <MaterialIcons name="login" size={22} color="white" />
                          )}
                          <Text style={styles.buttonText}>
                            {isLoggingIn ? 'Logging in...' : 'Login'}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    {loginError ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error" size={16} color="#f44336" />
                        <Text style={styles.errorText}>{loginError}</Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              </Animated.View>

              {/* Simplified Footer */}
              <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <View style={styles.footerContent}>
                  <MaterialIcons name="verified" size={16} color="#FFD54F" />
                  <Text style={styles.footerText}>
                    🇮🇳 Government of Karnataka • Digital India Initiative
                  </Text>
                </View>
                <Text style={styles.footerSubtext}>
                  ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಡಿಜಿಟಲ್ ಇಂಡಿಯಾ ಉಪಕ್ರಮ
                </Text>
              </Animated.View>
            </Animated.ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (isSmallScreen: boolean, isTablet: boolean, width: number, height: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    justifyContent: 'space-between',
    minHeight: Math.max(0, height - 100),
  },
  tabletContent: {
    paddingHorizontal: width * 0.15,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.03,
    marginBottom: height * 0.02,
  },
  logoContainer: {
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  officialTitle: {
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: height * 0.008,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  departmentText: {
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: height * 0.02,
  },
  tabletForm: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  loginCard: {
    borderRadius: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    backgroundColor: 'white',
    marginBottom: height * 0.015,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: height * 0.035,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  headerIconContainer: {
    marginBottom: height * 0.015,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  formSubtitle: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: '#FF6F00',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: height * 0.025,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    fontSize: isSmallScreen ? 14 : 16,
    color: 'black',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 8,
    gap: 4,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  loginButtonContainer: {
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
    borderRadius: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  loginButton: {
    borderRadius: 16,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: isSmallScreen ? 15 : isTablet ? 19 : 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: height * 0.025,
    marginTop: height * 0.015,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  footerText: {
    fontSize: isSmallScreen ? 10 : isTablet ? 13 : 11,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerSubtext: {
    fontSize: isSmallScreen ? 9 : isTablet ? 12 : 10,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: height * 0.01,
  },
});
