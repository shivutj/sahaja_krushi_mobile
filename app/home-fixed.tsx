import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUERIES_BASE } from './config/api';

// Professional home screen with better colors and full mobile layout
export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isTablet = width >= 768;
  
  const responsiveStyles = useMemo(() => ({
    padding: isSmallScreen ? 8 : isTablet ? 16 : 12,
    titleSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    heroHeight: Math.min(height * 0.22, isTablet ? 160 : 140),
    menuIconSize: isSmallScreen ? 18 : isTablet ? 24 : 22,
    statIconSize: isSmallScreen ? 22 : isTablet ? 30 : 26,
    cardSpacing: isSmallScreen ? 6 : isTablet ? 12 : 8,
  }), [isSmallScreen, isTablet, height]);

  const { uploaded } = useLocalSearchParams<{ uploaded?: string }>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [summary, setSummary] = useState({ total: 0, open: 0, answered: 0, closed: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Optimized time update
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const timer = setInterval(updateTime, 300000);
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('ಶುಭೋದಯ');
    else if (hour < 17) setGreeting('ಶುಭಾಹ್ನ');
    else setGreeting('ಶುಭಸಂಧ್ಯೆ');
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (uploaded === '1') {
      setShowUploadSuccess(true);
      const t = setTimeout(() => setShowUploadSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [uploaded]);

  // Optimized summary fetching
  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      
      const cachedSummary = await AsyncStorage.getItem('summaryCache');
      const cacheTime = await AsyncStorage.getItem('summaryCacheTime');
      const now = Date.now();
      
      if (cachedSummary && cacheTime && (now - parseInt(cacheTime)) < 300000) {
        setSummary(JSON.parse(cachedSummary));
        setLoadingSummary(false);
        return;
      }

      const raw = await AsyncStorage.getItem('farmerSession');
      const session = raw ? JSON.parse(raw) : null;
      const farmerId = session?.farmerId;
      
      if (!farmerId) {
        setLoadingSummary(false);
        return;
      }

      const resp = await fetch(`${QUERIES_BASE}/mine?farmerId=${encodeURIComponent(farmerId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!resp.ok) throw new Error('Failed to fetch summary');
      
      const json = await resp.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      const open = list.filter((q: any) => q.status === 'open').length;
      const answered = list.filter((q: any) => q.status === 'answered').length;
      const closed = list.filter((q: any) => q.status === 'closed').length;
      
      const newSummary = { total: list.length, open, answered, closed };
      setSummary(newSummary);
      
      await AsyncStorage.setItem('summaryCache', JSON.stringify(newSummary));
      await AsyncStorage.setItem('summaryCacheTime', now.toString());
      
    } catch (error) {
      console.log('Summary fetch error:', error);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const formatTime = useCallback(() => {
    return currentTime.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  }, [currentTime]);

  // Professional menu items with muted colors
  const menuItems = useMemo(() => [
    { 
      title: 'ಕೃಷಿ ಪ್ರಶ್ನೆ', 
      subtitle: 'Upload Query',
      icon: 'cloud-upload' as const, 
      route: '/upload' as const, 
      gradient: ['#2E7D32', '#388E3C'] as const,
      iconBg: 'rgba(46, 125, 50, 0.1)',
    },
    { 
      title: 'ಪ್ರಶ್ನೆಗಳು', 
      subtitle: 'Query Status',
      icon: 'history' as const, 
      route: '/history' as const, 
      gradient: ['#1565C0', '#1976D2'] as const,
      iconBg: 'rgba(21, 101, 192, 0.1)',
    },
    { 
      title: 'ಬೆಳೆ ವರದಿಗಳು', 
      subtitle: 'Crop Reports',
      icon: 'agriculture' as const, 
      route: '/crop-reports' as const, 
      gradient: ['#E65100', '#F57C00'] as const,
      iconBg: 'rgba(230, 81, 0, 0.1)',
    },
    { 
      title: 'ಸುದ್ದಿಗಳು', 
      subtitle: 'News',
      icon: 'article' as const, 
      route: '/news' as const, 
      gradient: ['#6A1B9A', '#7B1FA2'] as const,
      iconBg: 'rgba(106, 27, 154, 0.1)',
    },
    { 
      title: 'ಜ್ಞಾನ', 
      subtitle: 'Knowledge',
      icon: 'school' as const, 
      route: '/knowledge' as const, 
      gradient: ['#C62828', '#D32F2F'] as const,
      iconBg: 'rgba(198, 40, 40, 0.1)',
    },
    { 
      title: 'ವಿವರಗಳು', 
      subtitle: 'Details',
      icon: 'info' as const, 
      route: '/sahaja-details' as const, 
      gradient: ['#37474F', '#455A64'] as const,
      iconBg: 'rgba(55, 71, 79, 0.1)',
    },
  ], []);

  const styles = useMemo(() => getStyles(isSmallScreen, isTablet, width, height, responsiveStyles), [isSmallScreen, isTablet, width, height, responsiveStyles]);

  return (
    <View style={styles.container}>
      {showUploadSuccess && (
        <View style={styles.successBanner}>
          <MaterialIcons name="check-circle" size={16} color="#2E7D32" />
          <Text style={styles.successBannerText}>Welcome back!</Text>
        </View>
      )}
      
      {/* Professional Header */}
      <LinearGradient 
        colors={['#0D5302', '#1B5E20', '#2E7D32']} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.logoSection}>
              <View style={styles.govLogo}>
                <MaterialIcons name="eco" size={22} color="#C8E6C9" />
              </View>
              <View>
                <Text style={[styles.appTitle, { fontSize: responsiveStyles.titleSize }]}>ಸಹಜ ಕೃಷಿ</Text>
                <Text style={styles.govText}>Govt. of Karnataka</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn}>
              <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.profileCircle}>
                <MaterialIcons name="person" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Professional Hero Section */}
      <View style={[styles.heroSection, { height: responsiveStyles.heroHeight }]}>
        <LinearGradient 
          colors={['#0D5302', '#1B5E20', '#2E7D32']} 
          style={styles.heroGradient}
          start={{x: 0, y: 0}} 
          end={{x: 1, y: 1}}
        >
          <View style={styles.heroContent}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.heroTitle}>ರೈತರೇ, ನಮಸ್ಕಾರ</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.weatherInfo}>
                <MaterialIcons name="wb-sunny" size={18} color="#FFEB3B" />
                <Text style={styles.infoText}>28°C</Text>
              </View>
              <View style={styles.timeInfo}>
                <MaterialIcons name="access-time" size={16} color="white" />
                <Text style={styles.timeText}>{formatTime()}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Professional Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <MaterialIcons name="assignment" size={responsiveStyles.statIconSize} color="#2E7D32" />
            <View style={styles.statNumberContainer}>
              {loadingSummary ? (
                <ActivityIndicator size="small" color="#2E7D32" />
              ) : (
                <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{summary.total}</Text>
              )}
            </View>
            <Text style={styles.statLabel}>ಒಟ್ಟು</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <MaterialIcons name="pending-actions" size={responsiveStyles.statIconSize} color="#F57C00" />
            <View style={styles.statNumberContainer}>
              {loadingSummary ? (
                <ActivityIndicator size="small" color="#F57C00" />
              ) : (
                <Text style={[styles.statNumber, { color: '#F57C00' }]}>{summary.open}</Text>
              )}
            </View>
            <Text style={styles.statLabel}>ಬಾಕಿ</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <MaterialIcons name="check-circle" size={responsiveStyles.statIconSize} color="#2E7D32" />
            <View style={styles.statNumberContainer}>
              {loadingSummary ? (
                <ActivityIndicator size="small" color="#2E7D32" />
              ) : (
                <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{summary.answered}</Text>
              )}
            </View>
            <Text style={styles.statLabel}>ಉತ್ತರ</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <MaterialIcons name="task-alt" size={responsiveStyles.statIconSize} color="#7B1FA2" />
            <View style={styles.statNumberContainer}>
              {loadingSummary ? (
                <ActivityIndicator size="small" color="#7B1FA2" />
              ) : (
                <Text style={[styles.statNumber, { color: '#7B1FA2' }]}>{summary.closed}</Text>
              )}
            </View>
            <Text style={styles.statLabel}>ಮುಗಿದಿದೆ</Text>
          </View>
        </View>
      </View>

      {/* Professional Menu Section - Full mobile layout */}
      <View style={styles.menuSection}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.menuCard,
                { 
                  width: '48%',
                  marginBottom: responsiveStyles.cardSpacing,
                }
              ]}
              onPress={() => router.push(item.route)}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={item.gradient} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}}
                style={styles.menuCardContent}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon} size={responsiveStyles.menuIconSize} color="white" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Professional Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 ಕರ್ನಾಟಕ ಸರ್ಕಾರ • Digital India Initiative</Text>
      </View>
    </View>
  );
}

const getStyles = (isSmallScreen: boolean, isTablet: boolean, width: number, height: number, responsiveStyles: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
  },
  
  // Professional Header
  header: { 
    paddingVertical: 12,
    paddingHorizontal: responsiveStyles.padding,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10,
  },
  govLogo: {
    backgroundColor: 'rgba(200,230,201,0.2)',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(200,230,201,0.3)',
  },
  appTitle: { 
    color: 'white', 
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  govText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  profileBtn: { 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Professional Hero Section
  heroSection: { 
    margin: responsiveStyles.padding,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  heroGradient: { 
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  greeting: { 
    color: '#C8E6C9', 
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroTitle: { 
    color: 'white', 
    fontSize: 20,
    fontWeight: '900', 
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76,175,80,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 11,
  },

  // Professional Stats Section
  statsSection: {
    paddingHorizontal: responsiveStyles.padding,
    paddingVertical: 12,
  },
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statNumberContainer: {
    marginTop: 4,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: { 
    fontSize: 18, 
    fontWeight: '900', 
    textAlign: 'center',
  },
  statLabel: { 
    fontSize: 10, 
    color: '#666', 
    fontWeight: '700',
    textAlign: 'center',
  },

  // Professional Menu Section - Full mobile layout
  menuSection: {
    flex: 1,
    paddingHorizontal: responsiveStyles.padding,
    paddingVertical: 12,
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  menuCardContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 85,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  menuTitle: { 
    color: 'white', 
    fontWeight: '800', 
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 12,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  menuSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Professional Footer
  footer: {
    backgroundColor: 'rgba(27,94,32,0.05)',
    paddingVertical: 8,
    paddingHorizontal: responsiveStyles.padding,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(76,175,80,0.2)',
  },
  footerText: {
    fontSize: 9,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  successBanner: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successBannerText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
});
