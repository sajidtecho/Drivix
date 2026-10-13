import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Car,
  AlertTriangle,
  CreditCard,
  Receipt,
  Key,
  MapPin,
  ArrowRight,
  ExternalLink,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Card } from './Card';
import { Badge } from './Badge';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface CoreServiceItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  btnText?: string;
  url?: string;
  isAvailable: boolean;
  hasViewMap?: boolean;
}

export interface CoreServicesShowcaseProps {
  onBookParking: () => void;
  onViewMap: () => void;
}

const CORE_SERVICES: CoreServiceItem[] = [
  {
    id: 'parking',
    title: 'Car Parking',
    description:
      'No more running in circles to find parking in your city! Book a parking stop for your car whenever you go out in some simple steps.',
    icon: Car,
    btnText: 'Book Parking Spot',
    isAvailable: true,
    hasViewMap: true,
  },
  {
    id: 'challan',
    title: 'Traffic Challan',
    description:
      'Check the status of your traffic police challan online - quickly and easily.',
    icon: AlertTriangle,
    btnText: 'Check Challan Status',
    url: 'https://echallan.parivahan.gov.in/index/accused-challan',
    isAvailable: true,
  },
  {
    id: 'fastag',
    title: 'FASTag',
    description:
      'Recharge or buy a FASTag instantly and save more on your road trips.',
    icon: CreditCard,
    btnText: 'Recharge FASTag',
    url: 'https://paytm.com/fastag-recharge',
    isAvailable: true,
  },
  {
    id: 'testdrive',
    title: 'Test Drive',
    description:
      'Book a free test drive for your favorite car model right from your phone.',
    icon: Car,
    btnText: 'Book Test Drive',
    url: 'https://www.carwale.com/book-test-drive/',
    isAvailable: true,
  },
  {
    id: 'payments',
    title: 'Bill Payments',
    description:
      'Secure utility bill payments with absolute convenience and extra savings.',
    icon: Receipt,
    btnText: 'Pay Utility Bills',
    url: 'https://paytm.com/rent-payment',
    isAvailable: true,
  },
  {
    id: 'valet',
    title: 'Valet Services',
    description:
      'Premium on-demand valet services for commercial hubs and private events.',
    icon: Key,
    isAvailable: false,
  },
];

export const CoreServicesShowcase: React.FC<CoreServicesShowcaseProps> = ({
  onBookParking,
  onViewMap,
}) => {
  const [activeTab, setActiveTab] = useState<string>('parking');

  const handleTabPress = (service: CoreServiceItem) => {
    if (!service.isAvailable) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(service.id);
  };

  const handleActionPress = async (service: CoreServiceItem) => {
    if (service.id === 'parking') {
      onBookParking();
      return;
    }

    if (service.url) {
      try {
        const canOpen = await Linking.canOpenURL(service.url);
        if (canOpen) {
          await Linking.openURL(service.url);
        }
      } catch (err) {
        console.warn('Could not launch external service:', err);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Explore our <Text style={styles.titleHighlight}>Core Services</Text>
        </Text>
        <Text style={styles.subtitle}>
          Interactive features built to remove friction from every touchpoint of your journey.
        </Text>
      </View>

      {/* ─── Service Cards ─── */}
      <View style={styles.servicesList}>
        {CORE_SERVICES.map((service) => {
          const isActive = activeTab === service.id;
          const Icon = service.icon;

          if (isActive) {
            return (
              <Card key={service.id} selected={true} style={styles.activeCard}>
                {/* Active Card Header */}
                <View style={styles.activeHeaderRow}>
                  <View style={styles.activeIconBox}>
                    <Icon size={20} color={Colors.primaryYellow} />
                  </View>
                  <Text style={styles.activeTitle}>{service.title}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.activeDescription}>{service.description}</Text>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={() => handleActionPress(service)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryActionText}>{service.btnText}</Text>
                    {service.url ? (
                      <ExternalLink size={16} color="#171717" style={{ marginLeft: 6 }} />
                    ) : (
                      <ArrowRight size={16} color="#171717" style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>

                  {service.hasViewMap && (
                    <TouchableOpacity
                      style={styles.secondaryMapButton}
                      onPress={onViewMap}
                      activeOpacity={0.85}
                    >
                      <MapPin size={15} color="#171717" style={{ marginRight: 4 }} />
                      <Text style={styles.secondaryMapText}>View Map</Text>
                      <ArrowRight size={14} color="#171717" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          }

          // Inactive / Collapsed Item
          return (
            <TouchableOpacity
              key={service.id}
              activeOpacity={service.isAvailable ? 0.7 : 1}
              onPress={() => handleTabPress(service)}
              style={[
                styles.inactiveItem,
                !service.isAvailable && styles.disabledItem,
              ]}
            >
              <View style={styles.inactiveLeft}>
                <View style={styles.inactiveIconBox}>
                  <Icon
                    size={16}
                    color={service.isAvailable ? Colors.textPrimary : Colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.inactiveTitle,
                    !service.isAvailable && styles.disabledTitle,
                  ]}
                >
                  {service.title}
                </Text>
              </View>

              {!service.isAvailable && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  titleHighlight: {
    color: '#D97706',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  servicesList: {
    gap: Spacing.sm,
  },
  activeCard: {
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
    borderWidth: 1.5,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activeIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  activeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: -0.2,
  },
  activeBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  activeDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: 'rgba(23, 23, 23, 0.85)',
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
  },
  secondaryMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#171717',
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  secondaryMapText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },
  inactiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  disabledItem: {
    opacity: 0.65,
    backgroundColor: '#FAFAFA',
  },
  inactiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inactiveIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.cardBackgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  inactiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  disabledTitle: {
    color: Colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
