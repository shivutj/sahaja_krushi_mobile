import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Animated, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
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

// Single-page login screen with better gradients and visible text
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

  // Optimized animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  const BASE_URL = FARMERS_BASE;

  // Optimized animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Memoized functions
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

  // Optimized login
  const handleLogin = useCallback(async () => {
    setPhoneError('');
    setDobError('');
    setLoginError('');
    
    const phone = phoneNumber.replace(/\D/g, '').slice(0, 10).trim();
    const dobNormalized = normalizeDob(dob);

    let failed = false;

    if (!phone) {
      setPhoneError('Please enter Phone Number');
      failed = true;
    } else if (phone.length !== 10) {
      setPhoneError('Enter a valid 10-digit Phone Number');
      failed = true;
    }

    if (!dobNormalized) {
      setDobError('Please enter Date of Birth');
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await axios.post(`${BASE_URL}/login`, 
        { contactNumber: phone, dateOfBirth: dobNormalized },
        { 
          signal: controller.signal,
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
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
    logoSize: isSmallScreen ? 70 : isTablet ? 100 : 80,
    titleSize: isSmallScreen ? 22 : isTablet ? 32 : 26,
    subtitleSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    cardPadding: isSmallScreen ? 20 : isTablet ? 32 : 24,
    buttonHeight: isSmallScreen ? 48 : isTablet ? 56 : 52,
    inputHeight: isSmallScreen ? 48 : isTablet ? 56 : 52,
  }), [isSmallScreen, isTablet]);

  const styles = useMemo(() => getStyles(isSmallScreen, isTablet, width, height, responsiveStyles), [isSmallScreen, isTablet, width, height, responsiveStyles]);

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" />

      {/* Beautiful gradient background */}
      <LinearGradient
        colors={['#0D5302', '#1B5E20', '#2E7D32', '#388E3C', '#4CAF50']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              {/* Compact Header */}
              <Animated.View style={[
                styles.header,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }] 
                }
              ]}>
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
                      size={responsiveStyles.logoSize * 0.5} 
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
                  ಕೃಷಿ ಇಲಾಖೆ
                </Text>
              </Animated.View>

              {/* Compact Login Form */}
              <Animated.View style={[
                styles.formContainer,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }] 
                }
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
                      <Text style={styles.formTitle}>ರೈತ ಲಾಗಿನ್</Text>
                      <Text style={styles.formSubtitle}>ಮೊಬೈಲ್ + ಜನ್ಮ ದಿನಾಂಕ ಲಾಗಿನ್</Text>
                    </View>

                    {/* Phone Number Input with visible text */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>ಫೋನ್ ಸಂಖ್ಯೆ</Text>
                      <TextInput
                        mode="outlined"
                        value={phoneNumber}
                        onChangeText={text => {
                          const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(digitsOnly);
                          setPhoneError('');
                          setLoginError('');
                        }}
                        style={[styles.input, { height: responsiveStyles.inputHeight }]}
                        left={<TextInput.Icon icon="phone" iconColor="#666" />}
                        placeholder="10 ಅಂಕಿ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        outlineColor="rgba(46, 125, 50, 0.3)"
                        activeOutlineColor="#388E3C"
                        error={!!phoneError}
                        theme={{ 
                          colors: { 
                            text: '#000',
                            primary: '#388E3C',
                            outline: 'rgba(46, 125, 50, 0.3)',
                            background: '#fff',
                            onSurface: '#000',
                            onSurfaceVariant: '#666',
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

                    {/* Date of Birth Input with visible text */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>ಜನ್ಮ ದಿನಾಂಕ</Text>
                      <TextInput
                        mode="outlined"
                        value={dob}
                        onChangeText={v => { setDob(v); setDobError(''); setLoginError(''); }}
                        style={[styles.input, { height: responsiveStyles.inputHeight }]}
                        left={<TextInput.Icon icon="calendar" iconColor="#666" onPress={onPressOpenPicker} />}
                        placeholder="YYYY-MM-DD ಅಥವಾ DD/MM/YYYY"
                        placeholderTextColor="#999"
                        outlineColor="rgba(46, 125, 50, 0.3)"
                        activeOutlineColor="#388E3C"
                        error={!!dobError}
                        theme={{ 
                          colors: { 
                            text: '#000',
                            primary: '#388E3C',
                            outline: 'rgba(46, 125, 50, 0.3)',
                            background: '#fff',
                            onSurface: '#000',
                            onSurfaceVariant: '#666',
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

                    {/* Login Button */}
                    <TouchableOpacity 
                      onPress={handleLogin} 
                      disabled={isLoggingIn}
                      style={styles.loginButtonContainer}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={isLoggingIn 
                          ? ['#A5D6A7', '#C8E6C9'] 
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
                            <MaterialIcons name="login" size={20} color="white" />
                          )}
                          <Text style={styles.buttonText}>
                            {isLoggingIn ? 'ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ...' : 'ಲಾಗಿನ್'}
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

                    {/* Help Text */}
                    <View style={styles.helpContainer}>
                      <MaterialIcons name="info" size={14} color="#666" />
                      <Text style={styles.helpText}>ನಿಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಜನ್ಮ ದಿನಾಂಕ ನಮೂದಿಸಿ</Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>

              {/* Credits (small, unobtrusive, no extra height) */}
              <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' }}>
                  © 2025 • Developed by Prajwal D R & Shivu T J
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (isSmallScreen: boolean, isTablet: boolean, width: number, height: number, responsiveStyles: any) => StyleSheet.create({
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
  content: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
  },
  logoContainer: {
    marginBottom: height * 0.015,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  officialTitle: {
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: height * 0.005,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  departmentText: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: height * 0.01,
  },
  loginCard: {
    borderRadius: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    backgroundColor: 'white',
    marginBottom: height * 0.01,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: height * 0.03,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  formTitle: {
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    color: '#2E7D32',
    fontWeight: '900',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: isSmallScreen ? 12 : isTablet ? 14 : 13,
    color: '#F57C00',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputContainer: {
    marginBottom: height * 0.02,
  },
  inputLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#333',
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    fontSize: isSmallScreen ? 14 : 16,
    color: '#000',
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
    marginBottom: height * 0.015,
    borderRadius: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    gap: 8,
    zIndex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: height * 0.015,
    paddingHorizontal: 8,
    gap: 6,
  },
  helpText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: height * 0.015,
    marginTop: height * 0.01,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  footerText: {
    fontSize: isSmallScreen ? 10 : isTablet ? 12 : 11,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerSubtext: {
    fontSize: isSmallScreen ? 9 : isTablet ? 11 : 10,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
});
