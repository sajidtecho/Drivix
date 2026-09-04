import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { FileText, ShieldCheck, Shield, Zap, Droplet, User, PhoneCall, Truck } from 'lucide-react-native';

interface QuickServicesGridProps {
  isServicesExpanded: boolean;
  onToggleExpand: (expand: boolean) => void;
  onSelectService: (serviceLabel: string, route: string) => void;
  panHandlers?: any;
  dragHandlePanHandlers?: any;
  colors: any;
}

const SERVICES_LIST = [
  { label: 'Documents', sub: 'Secure Vault', icon: FileText, color: '#a78bfa', route: '/explore?tab=documents' },
  { label: 'Pollution', sub: 'Renewals', icon: ShieldCheck, color: '#34d399', route: '/explore' },
  { label: 'Insurance', sub: 'Shield & Protect', icon: Shield, color: '#fbbf24', route: '/explore' },
  { label: 'EV Charging', sub: 'Power up', icon: Zap, color: '#10b981', route: '/ev-charging' },
  { label: 'Car Wash', sub: 'Sparkle clean', icon: Droplet, color: '#60a5fa', route: '/explore' },
  { label: 'Driver Hub', sub: 'Expert drivers', icon: User, color: '#f87171', route: '/driver-hub' },
  { label: 'Emergency', sub: 'SOS Support', icon: PhoneCall, color: '#ef4444', route: '/explore' },
  { label: 'Towing', sub: 'Roadside Help', icon: Truck, color: '#f59e0b', route: '/explore' },
];

export const QuickServicesGrid: React.FC<QuickServicesGridProps> = ({
  isServicesExpanded,
  onToggleExpand,
  onSelectService,
  panHandlers,
  dragHandlePanHandlers,
  colors,
}) => {
  const visibleServices = SERVICES_LIST.slice(0, isServicesExpanded ? 8 : 4);

  // Chunk services into pairs of 2 per row
  const rows = [];
  for (let i = 0; i < visibleServices.length; i += 2) {
    rows.push(visibleServices.slice(i, i + 2));
  }

  return (
    <View style={styles.servicesSection} {...panHandlers}>
      <View style={styles.servicesHeader}>
        <Text style={[styles.servicesTitle, { color: colors.text }]}>Our Services</Text>
        <TouchableOpacity
          onPress={() => onToggleExpand(!isServicesExpanded)}
          style={styles.viewMoreBtn}
        >
          <Text style={[styles.viewMoreText, { color: colors.primary }]}>
            {isServicesExpanded ? 'View Less' : 'View More'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        {rows.map((rowItems, rowIndex) => (
          <View key={rowIndex} style={styles.serviceRow}>
            {rowItems.map((svc) => {
              const IconComp = svc.icon;
              return (
                <TouchableOpacity
                  key={svc.label}
                  style={[
                    styles.serviceCapsule,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.borderGlass,
                    },
                  ]}
                  onPress={() => onSelectService(svc.label, svc.route)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: `${svc.color}18` }]}>
                    <IconComp size={18} color={svc.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceCapsuleLabel, { color: colors.text }]} numberOfLines={1}>
                      {svc.label}
                    </Text>
                    <Text style={[styles.serviceCapsuleSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {svc.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {rowItems.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}
      </View>

      {/* Interactive One UI Drag Pill */}
      <View style={styles.dragHandleContainer} {...dragHandlePanHandlers}>
        <View style={[styles.dragHandleBar, { backgroundColor: colors.textSecondary }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  servicesSection: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  servicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewMoreBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'column',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  serviceCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  serviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCapsuleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  serviceCapsuleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  dragHandleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
});

export default QuickServicesGrid;
