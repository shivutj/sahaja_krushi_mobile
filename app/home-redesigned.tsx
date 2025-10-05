import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, useWindowDimensions, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUERIES_BASE } from './config/api';

const initialDims = Dimensions.get('window');
const initialIsSmall = initialDims.width < 360;
const initialIsTablet = initialDims.width > 600;

// Redesigned home screen with better layout and colors
export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isTablet = width >= 768;
  
  const responsiveStyles = useMemo(() => ({
    padding: isSmallScreen ? 12 : isTablet ? 20 : 16,
    titleSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    heroHeight: Math.min(height * 0.22, isTablet ? 200 : 180),
    menuIconSize: isSmallScreen ? 20 : isTablet ? 28 : 24,
    statIconSize: isSmallScreen ? 28 : isTablet ? 36 : 32,
    cardSpacing: isSmallScreen ? 8 : isTablet ? 16 : 12,
  }), [isSmallScreen, isTablet, height]);

  const { uploaded } = useLocalSearchParams<{ uploaded?: string }>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [summary, setSummary] = useState({ total: 0, open: 0, answered: 0, closed: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Optimized summary fetching with caching
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }, [fetchSummary]);

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

  // Redesigned menu items with better colors
  const menuItems = useMemo(() => [
    { 
      title: 'ಕೃಷಿ ಪ್ರಶ್ನೆ ಅಪ್ಲೋಡ್', 
      subtitle: 'Upload Query',
      icon: 'cloud-upload' as const, 
      route: '/upload' as const, 
      gradient: ['#2E7D32', '#388E3C', '#4CAF50'] as const,
      iconBg: 'rgba(76, 175, 80, 0.15)',
    },
    { 
      title: 'ಪ್ರಶ್ನೆಗಳ ಸ್ಥಿತಿ', 
      subtitle: 'Query Status',
      icon: 'history' as const, 
      route: '/history' as const, 
      gradient: ['#1976D2', '#2196F3', '#42A5F5'] as const,
      iconBg: 'rgba(33, 150, 243, 0.15)',
    },
    { 
      title: 'ಬೆಳೆ ವರದಿಗಳು', 
      subtitle: 'Crop Reports',
      icon: 'agriculture' as const, 
      route: '/crop-reports' as const, 
      gradient: ['#F57C00', '#FF9800', '#FFB74D'] as const,
      iconBg: 'rgba(255, 152, 0, 0.15)',
    },
    { 
      title: 'ಕೃಷಿ ಸುದ್ದಿಗಳು', 
      subtitle: 'Agri News',
      icon: 'article' as const, 
      route: '/news' as const, 
      gradient: ['#7B1FA2', '#9C27B0', '#BA68C8'] as const,
      iconBg: 'rgba(156, 39, 176, 0.15)',
    },
    { 
      title: 'ಜ್ಞಾನ ಆಧಾರ', 
      subtitle: 'Knowledge Base',
      icon: 'school' as const, 
      route: '/knowledge' as const, 
      gradient: ['#D32F2F', '#F44336', '#EF5350'] as const,
      iconBg: 'rgba(244, 67, 54, 0.15)',
    },
    { 
      title: 'ಸಹಜ ಕೃಷಿ ವಿವರಗಳು', 
      subtitle: 'Sahaja Details',
      icon: 'info' as const, 
      route: '/sahaja-details' as const, 
      gradient: ['#455A64', '#607D8B', '#90A4AE'] as const,
      iconBg: 'rgba(96, 125, 139, 0.15)',
    },
  ], []);

  const styles = useMemo(() => getStyles(isSmallScreen, isTablet, width, height, responsiveStyles), [isSmallScreen, isTablet, width, height, responsiveStyles]);

  return (
    <View style={styles.container}>
      {showUploadSuccess && (
        <View style={styles.successBanner}>
          <MaterialIcons name="check-circle" size={18} color="#2E7D32" />
          <Text style={styles.successBannerText}>Welcome back! Upload successful.</Text>
        </View>
      )}
      
      {/* Redesigned Header with better spacing */}
      <LinearGradient 
        colors={['#1B5E20', '#2E7D32', '#388E3C']} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.logoSection}>
              <View style={styles.govLogo}>
                <MaterialIcons name="eco" size={24} color="#C8E6C9" />
              </View>
              <View>
                <Text style={[styles.appTitle, { fontSize: responsiveStyles.titleSize }]}>ಸಹಜ ಕೃಷಿ</Text>
                <Text style={styles.govText}>Government of Karnataka</Text>
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

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Redesigned Hero Section */}
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

        {/* Redesigned Stats Section with better spacing */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Dashboard</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="assignment" size={responsiveStyles.statIconSize} color="white" />
              </View>
              <Text style={[styles.statNumber, { color: '#2E7D32' }]}>
                {loadingSummary ? <ActivityIndicator size="small" color="#2E7D32" /> : summary.total}
              </Text>
              <Text style={styles.statLabel}>ಒಟ್ಟು</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FF9800' }]}>
                <MaterialIcons name="pending-actions" size={responsiveStyles.statIconSize} color="white" />
              </View>
              <Text style={[styles.statNumber, { color: '#F57C00' }]}>
                {loadingSummary ? <ActivityIndicator size="small" color="#F57C00" /> : summary.open}
              </Text>
              <Text style={styles.statLabel}>ಬಾಕಿ</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="check-circle" size={responsiveStyles.statIconSize} color="white" />
              </View>
              <Text style={[styles.statNumber, { color: '#2E7D32' }]}>
                {loadingSummary ? <ActivityIndicator size="small" color="#2E7D32" /> : summary.answered}
              </Text>
              <Text style={styles.statLabel}>ಉತ್ತರ</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#9C27B0' }]}>
                <MaterialIcons name="task-alt" size={responsiveStyles.statIconSize} color="white" />
              </View>
              <Text style={[styles.statNumber, { color: '#7B1FA2' }]}>
                {loadingSummary ? <ActivityIndicator size="small" color="#7B1FA2" /> : summary.closed}
              </Text>
              <Text style={styles.statLabel}>ಮುಗಿದೆ</Text>
            </View>
          </View>
        </View>

        {/* Redesigned Menu Section with better layout */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.menuCard,
                  { 
                    width: isTablet ? '48%' : '47%',
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

        {/* Footer with better spacing */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 ಕರ್ನಾಟಕ ಸರ್ಕಾರ • Digital India Initiative</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (isSmallScreen: boolean, isTablet: boolean, width: number, height: number, responsiveStyles: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
  },
  
  // Redesigned Header
  header: { 
    paddingVertical: 16,
    paddingHorizontal: responsiveStyles.padding,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
  },
  govLogo: {
    backgroundColor: 'rgba(200,230,201,0.2)',
    borderRadius: 12,
    padding: 8,
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
    fontSize: 12,
    fontWeight: '600',
  },
  profileBtn: { 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Scrollable Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Redesigned Hero Section
  heroSection: { 
    margin: responsiveStyles.padding,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  heroGradient: { 
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  greeting: { 
    color: '#C8E6C9', 
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroTitle: { 
    color: 'white', 
    fontSize: 24,
    fontWeight: '900', 
    marginBottom: 16,
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
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76,175,80,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  timeText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 13,
  },

  // Redesigned Stats Section
  statsSection: {
    paddingHorizontal: responsiveStyles.padding,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: { 
    fontSize: 24, 
    fontWeight: '900', 
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: { 
    fontSize: 13, 
    color: '#666', 
    fontWeight: '700',
    textAlign: 'center',
  },

  // Redesigned Menu Section
  menuSection: {
    paddingHorizontal: responsiveStyles.padding,
    paddingVertical: 20,
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  menuCardContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  menuIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  menuTitle: { 
    color: 'white', 
    fontWeight: '800', 
    textAlign: 'center',
    marginBottom: 6,
    fontSize: 14,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Redesigned Footer
  footer: {
    backgroundColor: 'rgba(27,94,32,0.05)',
    paddingVertical: 16,
    paddingHorizontal: responsiveStyles.padding,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(76,175,80,0.2)',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  successBanner: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successBannerText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '700',
  },
});
