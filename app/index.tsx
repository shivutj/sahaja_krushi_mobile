import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Animated, TouchableOpacity, useWindowDimensions, ActivityIndicator, Keyboard } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Text, TextInput, Button, Card, useTheme, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
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
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Error states
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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

  // Auto-uppercase password input
  const handlePasswordChange = useCallback((text: string) => {
    const upperText = text.toUpperCase();
    setPassword(upperText);
    setPasswordError('');
    setLoginError('');
  }, []);

  // Password and Phone Login
  const handleLogin = useCallback(async () => {
    setPhoneError('');
    setPasswordError('');
    setLoginError('');
    
    const phone = phoneNumber.replace(/\D/g, '').slice(0, 10).trim();
    const pass = password.trim();

    let failed = false;

    if (!phone) {
      setPhoneError('Please enter Phone Number');
      failed = true;
    } else if (phone.length !== 10) {
      setPhoneError('Enter a valid 10-digit Phone Number');
      failed = true;
    }

    if (!pass) {
      setPasswordError('Please enter Password');
      failed = true;
    } else if (pass.length < 4) {
      setPasswordError('Password must be at least 4 characters');
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
        { contactNumber: phone, username: pass },
        { 
          signal: controller.signal,
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      clearTimeout(timeoutId);
      
      const payload = res?.data?.data ?? res?.data ?? { contactNumber: phone };
      await AsyncStorage.setItem('farmerSession', JSON.stringify(payload));
      Keyboard.dismiss();
      router.replace('/home');
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setLoginError('Request timed out. Please check your internet connection.');
      } else if (e.code === 'NETWORK_ERROR') {
        setLoginError('Network error. Please check your internet connection.');
      } else if (e.response?.status === 401) {
        setLoginError('Invalid password or phone number. Please check your credentials.');
      } else {
        setLoginError('Login failed. Please try again.');
      }
      Alert.alert('Error', 'Login failed. Please check your credentials and internet connection.');
    } finally {
      setIsLoggingIn(false);
    }
  }, [phoneNumber, password, BASE_URL]);

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
                  Sahaja Krushi
                </Text>
                <Text style={styles.departmentText}>
                  Agriculture Department
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
                      <Text style={styles.formTitle}>Farmer Login</Text>
                      
                    </View>

                    {/* Phone Number Input with visible text */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Phone Number</Text>
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
                        left={<TextInput.Icon icon="phone" />}
                        placeholder="Enter 10-digit mobile number"
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

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TextInput
                        mode="outlined"
                        value={password}
                        onChangeText={handlePasswordChange}
                        style={[styles.input, { height: responsiveStyles.inputHeight }]}
                        left={<TextInput.Icon icon="lock" />}
                        placeholder="e.g: NAME2002"
                        placeholderTextColor="#999"
                        outlineColor="rgba(46, 125, 50, 0.3)"
                        activeOutlineColor="#388E3C"
                        error={!!passwordError}
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
                        autoCapitalize="characters"
                        maxLength={20}
                        secureTextEntry={false}
                      />
                      {passwordError ? (
                        <View style={styles.errorContainer}>
                          <MaterialIcons name="error" size={16} color="#f44336" />
                          <Text style={styles.errorText}>{passwordError}</Text>
                        </View>
                      ) : null}
                      
                      {/* Password format hint */}
                      <View style={styles.hintContainer}>
                        <MaterialIcons name="info-outline" size={12} color="#666" />
                        <Text style={styles.hintText}>First 4 letters + Birth year</Text>
                      </View>
                    </View>

                    {/* Remember me removed */}

                    {/* Login Button */}
                    <TouchableOpacity 
                      onPress={handleLogin} 
                      disabled={isLoggingIn || !phoneNumber.trim() || !password.trim()}
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

                    {/* Help Text */}
                    <View style={styles.helpContainer}>
                      <MaterialIcons name="info" size={14} color="#666" />
                      <Text style={styles.helpText}>Enter your registered mobile number and password</Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>

              {/* Credits (small, unobtrusive, no extra height) */}
              <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>
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
    paddingHorizontal: Math.max(12, width * 0.04),
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
    width: '100%',
    alignSelf: 'center',
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
    marginBottom: Math.max(14, height * 0.02),
  },
  inputLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#333',
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 6,
  },
  input: {
    backgroundColor: '#fff',
    fontSize: isSmallScreen ? 14 : 16,
    color: '#000',
    width: '100%',
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
    marginTop: height * 0.02,
    paddingHorizontal: 8,
    gap: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  rememberText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 8,
    gap: 4,
  },
  hintText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 14,
  },
});
