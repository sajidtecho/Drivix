import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Car, Zap, AlertTriangle, X } from 'lucide-react-native';
import { RegisteredVehicle, UserProfile, DocumentComplianceStatus } from '@/types/user';

interface GarageCardProps {
  primaryVehicle: RegisteredVehicle | any;
  user: UserProfile | any;
  getDocumentCompliance: (type: 'DL' | 'PUC') => DocumentComplianceStatus;
  onNavigateToTab: (webRoute: string) => void;
  onDismiss: () => void;
  colors: any;
}

export const GarageCard: React.FC<GarageCardProps> = ({
  primaryVehicle,
  user,
  getDocumentCompliance,
  onNavigateToTab,
  onDismiss,
  colors,
}) => {
  if (!primaryVehicle) return null;

  const walletBalance = user?.walletBalance ?? 0;
  const isLowBalance = walletBalance < 150;
  const hasChallan = primaryVehicle.plate.charCodeAt(primaryVehicle.plate.length - 1) % 2 !== 0;

  const pucCompliance = getDocumentCompliance('PUC');
  const PucIcon = pucCompliance.icon;

  const dlCompliance = getDocumentCompliance('DL');
  const DlIcon = dlCompliance.icon;

  return (
    <View style={[styles.garageContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
      <View style={styles.garageHeader}>
        <View style={styles.garageHeaderLeft}>
          <Car size={16} color={colors.primary} />
          <Text style={[styles.garageTitle, { color: colors.text }]} numberOfLines={1}>
            {primaryVehicle.model}
          </Text>
          <Text style={[styles.garagePlate, { color: colors.textSecondary }]}>
            {primaryVehicle.plate}
          </Text>
        </View>
        <View style={styles.garageHeaderRight}>
          <TouchableOpacity onPress={() => onNavigateToTab('/explore?tab=vehicles')}>
            <Text style={[styles.garageLink, { color: colors.primary }]}>Manage</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.complianceRow}>
        {/* FASTag Badge */}
        <TouchableOpacity
          style={[
            styles.complianceBadge,
            {
              backgroundColor: isLowBalance ? 'rgba(255, 75, 75, 0.08)' : 'rgba(0, 204, 106, 0.08)',
              borderColor: isLowBalance ? 'rgba(255, 75, 75, 0.15)' : 'rgba(0, 204, 106, 0.15)',
            },
          ]}
          onPress={() => onNavigateToTab('/explore?tab=fastag')}
          activeOpacity={0.8}
        >
          <Zap size={11} color={isLowBalance ? '#ff4b4b' : '#00cc6a'} />
          <Text style={[styles.complianceText, { color: isLowBalance ? '#ff4b4b' : '#00cc6a' }]}>
            FASTag: ₹{walletBalance}
          </Text>
        </TouchableOpacity>

        {/* Challans Badge */}
        <TouchableOpacity
          style={[
            styles.complianceBadge,
            {
              backgroundColor: hasChallan ? 'rgba(255, 206, 0, 0.08)' : 'rgba(0, 204, 106, 0.08)',
              borderColor: hasChallan ? 'rgba(255, 206, 0, 0.15)' : 'rgba(0, 204, 106, 0.15)',
            },
          ]}
          onPress={() => onNavigateToTab('/explore?tab=bookings')}
          activeOpacity={0.8}
        >
          <AlertTriangle size={11} color={hasChallan ? '#ffce00' : '#00cc6a'} />
          <Text style={[styles.complianceText, { color: hasChallan ? '#ffce00' : '#00cc6a' }]}>
            {hasChallan ? '1 Challan' : '0 Challans'}
          </Text>
        </TouchableOpacity>

        {/* PUC Badge */}
        <TouchableOpacity
          style={[
            styles.complianceBadge,
            {
              backgroundColor: pucCompliance.bgColor,
              borderColor: pucCompliance.borderColor,
            },
          ]}
          onPress={() => onNavigateToTab('/explore?tab=documents')}
          activeOpacity={0.8}
        >
          <PucIcon size={11} color={pucCompliance.color} />
          <Text style={[styles.complianceText, { color: pucCompliance.color }]}>
            {pucCompliance.status}
          </Text>
        </TouchableOpacity>

        {/* DL Badge */}
        <TouchableOpacity
          style={[
            styles.complianceBadge,
            {
              backgroundColor: dlCompliance.bgColor,
              borderColor: dlCompliance.borderColor,
            },
          ]}
          onPress={() => onNavigateToTab('/explore?tab=documents')}
          activeOpacity={0.8}
        >
          <DlIcon size={11} color={dlCompliance.color} />
          <Text style={[styles.complianceText, { color: dlCompliance.color }]}>
            {dlCompliance.status}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  garageContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  garageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  garageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  garageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  garageTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  garagePlate: {
    fontSize: 12,
    fontWeight: '600',
  },
  garageLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  complianceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  complianceText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default GarageCard;
