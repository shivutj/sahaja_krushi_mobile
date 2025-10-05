import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
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

const baseResponsive = {
  padding: initialIsSmall ? 8 : initialIsTablet ? 16 : 12,
  titleSize: initialIsSmall ? 14 : initialIsTablet ? 18 : 16,
  heroHeight: Math.min(initialDims.height * 0.25, 260),
  menuIconSize: initialIsSmall ? 18 : 22,
  statIconSize: initialIsSmall ? 26 : 32,
};

const farmingImages = [
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
];

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isTablet = width >= 768; // widen tablet breakpoint for better layout
  const heroHeight = Math.min(height * 0.25, isTablet ? 280 : 260);
  const responsiveStyles = {
    padding: isSmallScreen ? 8 : isTablet ? 16 : 12,
    titleSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    heroHeight,
    menuIconSize: isSmallScreen ? 18 : isTablet ? 24 : 22,
    statIconSize: isSmallScreen ? 24 : isTablet ? 34 : 30,
  };
  const { uploaded } = useLocalSearchParams<{ uploaded?: string }>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageOpacity] = useState(new Animated.Value(1));
  const [summary, setSummary] = useState({ total: 0, open: 0, answered: 0, closed: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const timer = setInterval(updateTime, 60000);
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('ಶುಭೋದಯ');
    else if (hour < 17) setGreeting('ಶುಭಾಹ್ನ');
    else setGreeting('ಶುಭಸಂಧ್ಯೆ');
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const imageTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(imageOpacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(imageOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
      setCurrentImageIndex((prev) => (prev + 1) % farmingImages.length);
    }, 6000);
    return () => clearInterval(imageTimer);
  }, []);

  useEffect(() => {
    if (uploaded === '1') {
      setShowUploadSuccess(true);
      const t = setTimeout(() => setShowUploadSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [uploaded]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        // Per-farmer query counts only
        const raw = await AsyncStorage.getItem('farmerSession');
        const session = raw ? JSON.parse(raw) : null;
        const farmerId = session?.farmerId;
        if (!farmerId) return;
        const resp = await fetch(`${QUERIES_BASE}/mine?farmerId=${encodeURIComponent(farmerId)}`);
        const json = await resp.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        const open = list.filter((q: any) => q.status === 'open').length;
        const answered = list.filter((q: any) => q.status === 'answered').length;
        const closed = list.filter((q: any) => q.status === 'closed').length;
        setSummary({ total: list.length, open, answered, closed });
      } catch {
        // ignore summary errors on home
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  const formatTime = () => currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const menuItems = [
    { 
      title: 'ಕೃಷಿ ಪ್ರಶ್ನೆ ಅಪ್ಲೋಡ್', 
      subtitle: 'Upload Krushi Query',
      icon: 'cloud-upload' as const, 
      route: '/upload' as const, 
      gradient: ['#1B5E20', '#2E7D32', '#4CAF50'] as const,
    },
    { 
      title: 'ಪ್ರಶ್ನೆಗಳ ಸ್ಥಿತಿ', 
      subtitle: 'Query Status',
      icon: 'history' as const, 
      route: '/history' as const, 
      gradient: ['#1B5E20', '#2E7D32', '#4CAF50'] as const,
    },
    { 
      title: 'ಬೆಳೆ ವರದಿಗಳು', 
      subtitle: 'Crop Reports',
      icon: 'agriculture' as const, 
      route: '/crop-reports' as const, 
      gradient: ['#1B5E20', '#2E7D32', '#4CAF50'] as const,
    },
    { 
      title: 'ಕೃಷಿ ಸುದ್ದಿಗಳು', 
      subtitle: 'Agri News',
      icon: 'article' as const, 
      route: '/news' as const, 
      gradient: ['#1B5E20', '#2E7D32', '#4CAF50'] as const,
    },
    { 
      title: 'ಜ್ಞಾನ ಆಧಾರ', 
      subtitle: 'Knowledge Base',
      icon: 'school' as const, 
      route: '/knowledge' as const, 
      gradient: ['#1B5E20', '#2E7D32', '#4CAF50'] as const,
    },
   
    { 
      title: 'ಸಹಜ ಕೃಷಿ ವಿವರಗಳು', 
      subtitle: 'Sahaja Krushi Details',
      icon: 'info' as const, 
      route: '/sahaja-details' as const, 
      gradient: ['#1B5E20', '#2E7D32', '#4CAF50'] as const,
    },
 
   
  ];

  return (
    <View style={styles.container}>
      {showUploadSuccess && (
        <View style={styles.successBanner}>
          <MaterialIcons name="check-circle" size={16} color="#065F46" />
          <Text style={styles.successBannerText}>welcome back...!</Text>
        </View>
      )}
      {/* Green Government Header */}
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
                <MaterialIcons name="eco" size={20} color="#C8E6C9" />
              </View>
              <View>
                <Text style={[styles.appTitle, { fontSize: responsiveStyles.titleSize }]}>ಸಹಜ ಕೃಷಿ</Text>
                <Text style={styles.govText}>Government of Karnataka</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn}>
              <LinearGradient colors={['#4CAF50', '#66BB6A', '#81C784']} style={styles.profileCircle}>
                <MaterialIcons name="person" size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Compact Hero Section */}
        <Animated.View style={[styles.heroSection, { opacity: imageOpacity, height: responsiveStyles.heroHeight }]}>
          <ImageBackground source={{ uri: farmingImages[currentImageIndex] }} style={styles.heroImage}>
          <LinearGradient 
            colors={['rgba(13,83,2,0.9)', 'rgba(27,94,32,0.7)', 'transparent']} 
            style={styles.heroOverlay}
          >
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.heroTitle}>ರೈತರೇ, ನಮಸ್ಕಾರ</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.weatherInfo}>
                <MaterialIcons name="wb-sunny" size={16} color="#FFEB3B" />
                  <Text style={styles.infoText}>28°C</Text>
                </View>
                <View style={styles.timeInfo}>
                <MaterialIcons name="access-time" size={14} color="white" />
                  <Text style={styles.timeText}>{formatTime()}</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

      {/* Compact Stats Row */}
      <View style={styles.statsSection}>
          <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <MaterialIcons name="assignment" size={responsiveStyles.statIconSize} color="#1B5E20" />
            <Text style={[styles.statNumber, { color: '#1B5E20' }]}>{loadingSummary ? '—' : summary.total}</Text>
            <Text style={styles.statLabel}>ಒಟ್ಟು</Text>
            </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <MaterialIcons name="pending-actions" size={responsiveStyles.statIconSize} color="#E65100" />
            <Text style={[styles.statNumber, { color: '#E65100' }]}>{loadingSummary ? '—' : summary.open}</Text>
            <Text style={styles.statLabel}>ಬಾಕಿ</Text>
            </View>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <MaterialIcons name="check-circle" size={responsiveStyles.statIconSize} color="#2E7D32" />
            <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{loadingSummary ? '—' : summary.answered}</Text>
            <Text style={styles.statLabel}>ಉತ್ತರ</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <MaterialIcons name="task-alt" size={responsiveStyles.statIconSize} color="#7B1FA2" />
            <Text style={[styles.statNumber, { color: '#7B1FA2' }]}>{loadingSummary ? '—' : summary.closed}</Text>
            <Text style={styles.statLabel}>ಮುಗಿದೆ</Text>
            </View>
          </View>
        </View>

      {/* Menu Grid - Takes remaining space */}
      <View style={styles.menuSection}>
          <View style={styles.menuGrid}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.menuCard,
                  { width: isTablet ? '31%' : '48%' }
                ]}
                onPress={() => router.push(item.route)}
              activeOpacity={0.85}
            >
              <LinearGradient 
                colors={item.gradient} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}}
                style={styles.menuCardContent}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name={item.icon} size={responsiveStyles.menuIconSize} color="white" />
                </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      {/* Compact Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 ಕರ್ನಾಟಕ ಸರ್ಕಾರ • Digital India</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F1F8E9',
  },
  
  // Compact Green Header
  header: { 
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    elevation: 5,
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Compact Hero Section
  heroSection: { 
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
     marginHorizontal: 0,
     marginTop: 0,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  heroImage: { 
    flex: 1, 
    justifyContent: 'flex-end',
  },
  heroOverlay: { 
    padding: 16,
    justifyContent: 'flex-end',
  },
  greeting: { 
    color: '#C8E6C9', 
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  heroTitle: { 
    color: 'white', 
    fontSize: 20,
    fontWeight: '900', 
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    borderRadius: 10,
  },
  timeText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 11,
  },

  // Compact Stats Section
  statsSection: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  statNumber: { 
    fontSize: 22, 
    fontWeight: '900', 
    marginTop: 4,
    marginBottom: 4,
  },
  statLabel: { 
    fontSize: 12, 
    color: '#388E3C', 
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Menu Grid - Flexible
  menuSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  menuCardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: initialIsSmall ? 90 : 100,
  },
  menuIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  menuTitle: { 
    color: 'white', 
    fontWeight: '800', 
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 13,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Compact Footer
  footer: {
    backgroundColor: 'rgba(27,94,32,0.05)',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(76,175,80,0.2)',
  },
  footerText: {
    fontSize: 10,
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
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
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
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});