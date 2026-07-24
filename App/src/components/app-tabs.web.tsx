import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text, Platform, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { Menu, X, LogOut, Home, Ticket, User, Car, Wallet, FileText, Search, Sun, Moon, HelpCircle, ShieldCheck, Info, PhoneCall, ArrowLeft, Zap } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme, setThemeMode } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import LoginBottomSheet from '@/components/LoginBottomSheet';

// Module-level callback — lets any screen reopen the drawer programmatically
let _openDrawerCb: (() => void) | null = null;
export const openDrawer = () => _openDrawerCb?.();

const _headerVisibilityListeners = new Set<(visible: boolean) => void>();
export const setWebHeaderVisible = (visible: boolean) => {
  _headerVisibilityListeners.forEach((listener) => listener(visible));
};

export default function AppTabs() {
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const listener = (visible: boolean) => setHeaderVisible(visible);
    _headerVisibilityListeners.add(listener);
    return () => {
      _headerVisibilityListeners.delete(listener);
    };
  }, []);

  const scheme = useColorScheme();
  const colors = useTheme();

  return (
    <Tabs>
      {/* Shift page contents down below the 70px header bar only when visible */}
      <TabSlot style={{ height: '100%', paddingTop: headerVisible ? 70 : 0 }} />
      <TabList asChild>
        <CustomTabList>
          {/* Default tab triggers to register screens with Expo Router */}
          <TabTrigger name="home" href="/" asChild>
            <View />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <View />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function CustomTabList(props: TabListProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFaqExpanded, setIsFaqExpanded] = useState(false);
  const { user, isAuthenticated, setLoginVisible, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ tab?: string }>();
  const currentTab = params.tab || 'bookings';
  const [loginRequiredVisible, setLoginRequiredVisible] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Register the global openDrawer and visibility callbacks when this component mounts
  useEffect(() => {
    const listener = (visible: boolean) => setHeaderVisible(visible);
    _headerVisibilityListeners.add(listener);
    _openDrawerCb = () => setIsDrawerOpen(true);
    return () => { 
      _headerVisibilityListeners.delete(listener);
      _openDrawerCb = null; 
    };
  }, []);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useTheme();

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const navigateTo = (path: any, tabName?: string, isPublic?: boolean) => {
    setIsDrawerOpen(false);
    if (!isPublic && !isAuthenticated) {
      setLoginRequiredVisible(true);
      return;
    }
    if (tabName) {
      router.push({ pathname: path, params: { tab: tabName } } as any);
    } else {
      router.push(path as any);
    }
  };

  const menuItems = [
    { id: 'home', path: '/', label: 'Home', icon: Home, isPublic: true },
    { id: 'profile', path: '/explore', tabName: 'profile', label: 'Personal Details', icon: User },
    { id: 'vehicles', path: '/explore', tabName: 'vehicles', label: 'Registered Vehicle', icon: Car },
    { id: 'bookings', path: '/explore', tabName: 'bookings', label: 'Ticket and Bookings', icon: Ticket },
    { id: 'fastag', path: '/explore', tabName: 'fastag', label: 'FASTag Manager', icon: Zap },
    { id: 'wallet', path: '/explore', tabName: 'wallet', label: 'Wallet Balance', icon: Wallet },
    { id: 'documents', path: '/explore', tabName: 'documents', label: 'Secure Documents', icon: FileText },
    { id: 'faq', path: '/faq', label: 'Help and FAQ', icon: HelpCircle, isPublic: true },
  ];

  if (!headerVisible) {
    return (
      <View style={{ display: 'none' }}>
        {props.children}
      </View>
    );
  }

  return (
    <View {...props} style={[styles.tabListContainer, { backgroundColor: colors.background, borderBottomColor: colors.borderGlass }]}>
      <View style={styles.innerContainer}>
        <Image
          source={require('@/assets/images/Logo.png')}
          style={styles.logoImage}
          contentFit="contain"
        />

        {/* Capsule Search Bar in the middle */}
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
          <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search parking facilities..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        
        {/* Theme Toggle Button */}
        <TouchableOpacity 
          style={[styles.themeToggleBtn, { borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]} 
          onPress={toggleTheme}
        >
          {isDark ? (
            <Sun size={20} color="#ffce00" />
          ) : (
            <Moon size={20} color="#60646c" />
          )}
        </TouchableOpacity>
        
        {/* Hamburger Menu Trigger Button at the far right */}
        <TouchableOpacity 
          style={[styles.hamburgerBtn, { borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]} 
          onPress={() => setIsDrawerOpen(true)}
        >
          <Menu size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Default Expo Tab Triggers must be rendered in the tree to register pages */}
      <View style={{ display: 'none' }}>
        {props.children}
      </View>

      {/* Side Drawer Overlay */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlay}>
          {/* Backdrop click to close */}
          <Pressable style={styles.backdrop} onPress={() => setIsDrawerOpen(false)} />
          
          <View style={[styles.drawerContainer, { backgroundColor: colors.background === '#ffffff' ? '#f5f5f7' : '#15161e', borderLeftColor: colors.borderGlass }]}>
            <ScrollView style={styles.drawerHeaderSection} showsVerticalScrollIndicator={false}>
              <View style={[styles.drawerHeader, { borderBottomColor: colors.borderGlass }]}>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>DRIVIX MENU</Text>
                <TouchableOpacity onPress={() => setIsDrawerOpen(false)}>
                  <X size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Profile Summary Card */}
              {user && (
                <View style={[styles.drawerProfileCard, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
                  <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {(user.name === 'Mobile User' || !user.name) 
                        ? (user.mobile ? user.mobile.charAt(0) : 'U') 
                        : user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.profileTextInfo}>
                    <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                      {(user.name === 'Mobile User' || !user.name) ? (user.mobile ? `+91 ${user.mobile}` : 'User') : user.name}
                    </Text>
                    <View style={styles.walletMiniRow}>
                      <Text style={styles.walletMiniLabel}>Balance: </Text>
                      <Text style={[styles.walletMiniValue, { color: colors.primary }]}>Rs. {user.walletBalance ?? 0}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Navigation Section (Vertical Cute Capsules) */}
              <View style={styles.drawerLinks}>
                <Text style={styles.sectionLabel}>Navigation & Details</Text>
                
                <View style={styles.capsuleContainer}>
                  {menuItems.map((item) => {
                    const isFaqPage = ['/faq', '/safety', '/about', '/contact'].includes(pathname);
                    const isActive = item.isPublic
                      ? (item.id === 'faq' ? (isFaqExpanded || isFaqPage) : pathname === item.path)
                      : pathname === '/explore' && currentTab === item.tabName;
                    
                    const IconComp = (item.id === 'faq' && isFaqExpanded) ? ArrowLeft : item.icon;

                    return (
                      <React.Fragment key={item.id}>
                        <TouchableOpacity
                          style={[
                            styles.capsuleBtn,
                            isActive 
                              ? { backgroundColor: colors.backgroundSelected, borderColor: colors.primary } 
                              : { backgroundColor: colors.background === '#ffffff' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', borderColor: colors.borderGlass },
                          ]}
                          onPress={() => {
                            if (item.id === 'faq') {
                              setIsFaqExpanded(!isFaqExpanded);
                            } else {
                              if (item.isPublic) {
                                navigateTo(item.path, undefined, true);
                              } else {
                                navigateTo(item.path, item.tabName, false);
                              }
                            }
                          }}
                        >
                          <IconComp size={16} color={isActive ? colors.primary : colors.textSecondary} />
                          <Text
                            style={[
                              styles.capsuleText,
                              isActive ? { color: colors.primary } : { color: colors.textSecondary },
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>

                        {item.id === 'faq' && isFaqExpanded && (
                          <View style={styles.subGridContainer}>
                            <View style={styles.subGridRow}>
                              <TouchableOpacity
                                style={[styles.subGridBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                                onPress={() => navigateTo('/safety', undefined, true)}
                              >
                                <ShieldCheck size={16} color="#ffce00" />
                                <Text style={[styles.subGridText, { color: colors.text }]}>Safety</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[styles.subGridBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                                onPress={() => navigateTo('/faq', undefined, true)}
                              >
                                <HelpCircle size={16} color="#ffce00" />
                                <Text style={[styles.subGridText, { color: colors.text }]}>FAQs</Text>
                              </TouchableOpacity>
                            </View>

                            <View style={styles.subGridRow}>
                              <TouchableOpacity
                                style={[styles.subGridBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                                onPress={() => navigateTo('/about', undefined, true)}
                              >
                                <Info size={16} color="#ffce00" />
                                <Text style={[styles.subGridText, { color: colors.text }]}>About</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[styles.subGridBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                                onPress={() => navigateTo('/contact', undefined, true)}
                              >
                                <PhoneCall size={16} color="#ffce00" />
                                <Text style={[styles.subGridText, { color: colors.text }]}>Contact</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Login / Logout Trigger at the bottom */}
            {user ? (
              <TouchableOpacity
                style={styles.drawerLogoutBtn}
                onPress={() => {
                  setIsDrawerOpen(false);
                  logout();
                }}
              >
                <LogOut size={16} color="#ff4b4b" />
                <Text style={styles.drawerLogoutText}>Log Out Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.drawerLogoutBtn, { borderColor: colors.primary, backgroundColor: 'rgba(255, 206, 0, 0.02)' }]}
                onPress={() => {
                  setIsDrawerOpen(false);
                  setLoginVisible(true);
                }}
              >
                <User size={16} color="#ffce00" />
                <Text style={[styles.drawerLogoutText, { color: '#ffce00' }]}>Log In Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Guest Login Alert Modal */}
      <LoginBottomSheet
        visible={loginRequiredVisible}
        onCancel={() => setLoginRequiredVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#0b0c10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1000,
    paddingHorizontal: 24,
    height: '100%',
  },
  logoImage: {
    width: 100, // Slightly more compact to shift further left
    height: 36,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20, // capsule form
    paddingHorizontal: 12,
    height: 38,
    marginHorizontal: 20,
    maxWidth: 400, // center-bound width
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    height: '100%',
    padding: 0,
  },
  themeToggleBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 10,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pressed: {
    opacity: 0.7,
  },
  drawerOverlay: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContainer: {
    width: '80%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: '#15161e',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 10001,
  },
  drawerHeaderSection: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 12,
  },
  drawerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  drawerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffce00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#0b0c10',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileTextInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileEmail: {
    color: '#a0aab2',
    fontSize: 11,
    marginTop: 2,
    width: '100%',
    textAlign: 'center',
  },
  walletMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletMiniLabel: {
    color: '#a0aab2',
    fontSize: 11,
  },
  walletMiniValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  drawerLinks: {
    width: '100%',
  },
  sectionLabel: {
    color: '#a0aab2',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  capsuleContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  capsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    width: '100%',
  },
  capsuleBtnActive: {
    backgroundColor: 'rgba(255, 206, 0, 0.08)',
    borderColor: '#ffce00',
  },
  capsuleBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  capsuleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  capsuleTextActive: {
    color: '#ffce00',
  },
  capsuleTextInactive: {
    color: '#a0aab2',
  },
  subGridContainer: {
    marginTop: 8,
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  subGridRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  subGridBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  subGridText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.25)',
    backgroundColor: 'rgba(255, 75, 75, 0.02)',
  },
  drawerLogoutText: {
    color: '#ff4b4b',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
