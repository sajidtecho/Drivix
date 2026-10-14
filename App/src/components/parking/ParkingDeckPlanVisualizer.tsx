import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, {
  G,
  Path,
  Rect,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Line,
} from 'react-native-svg';
import {
  Zap,
  Accessibility,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Footprints,
  Car,
  Compass,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { ParkingFloor } from '../../types';

export interface ParkingDeckPlanVisualizerProps {
  floors: ParkingFloor[];
  selectedFloor: ParkingFloor | null;
  onSelectFloor: (floor: ParkingFloor) => void;
  selectedSlot?: string | null;
  onSelectSlot?: (slotId: string) => void;
  buildingName?: string;
}

interface DeckSlotItem {
  id: string;
  code: string;
  isAvailable: boolean;
  isEV: boolean;
  isAccessible: boolean;
  carColor?: string;
  carType?: 'sedan' | 'suv' | 'ev';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAN_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);
const PLAN_HEIGHT = 440;

// Dimensions for the parking bays
const AISLE_WIDTH = 70;
const BAY_WIDTH = 52;
const BAY_HEIGHT = 92;
const LEFT_BAY_X = 20;
const AISLE_X = LEFT_BAY_X + BAY_WIDTH + 8;
const RIGHT_BAY_X = AISLE_X + AISLE_WIDTH + 8;

export const ParkingDeckPlanVisualizer: React.FC<ParkingDeckPlanVisualizerProps> = ({
  floors,
  selectedFloor,
  onSelectFloor,
  selectedSlot,
  onSelectSlot,
  buildingName,
}) => {
  // Generate realistic deck slots for the selected floor
  const deckSlots = useMemo(() => {
    if (!selectedFloor) return { leftBays: [], rightBays: [] };

    const totalBays = 8; // 4 on left, 4 on right for crisp spacing
    const freeCount = Math.max(
      2,
      Math.min(
        totalBays,
        Math.round((selectedFloor.availableSlots / (selectedFloor.totalSlots || 1)) * totalBays)
      )
    );
    const evCount = selectedFloor.evSlots || 2;
    const prefix = selectedFloor.floorName?.charAt(0) || 'L';

    const carColors = ['#E2E8F0', '#38BDF8', '#64748B', '#0F172A', '#F8FAFC'];
    const carTypes: Array<'sedan' | 'suv' | 'ev'> = ['sedan', 'suv', 'ev', 'sedan'];

    const left: DeckSlotItem[] = [];
    const right: DeckSlotItem[] = [];

    for (let i = 1; i <= 4; i++) {
      const isEv = i === 1 && evCount > 0;
      const isAvailable = i <= Math.ceil(freeCount / 2);
      left.push({
        id: `${prefix}-0${i}`,
        code: `${prefix}-0${i}`,
        isAvailable,
        isEV: isEv,
        isAccessible: false,
        carColor: carColors[i % carColors.length],
        carType: isEv ? 'ev' : carTypes[i % carTypes.length],
      });
    }

    for (let i = 5; i <= 8; i++) {
      const isEv = i === 5 && evCount > 1;
      const isAvailable = i - 4 <= Math.floor(freeCount / 2);
      right.push({
        id: `${prefix}-0${i}`,
        code: `${prefix}-0${i}`,
        isAvailable,
        isEV: isEv,
        isAccessible: i === 8,
        carColor: carColors[(i + 1) % carColors.length],
        carType: isEv ? 'ev' : carTypes[i % carTypes.length],
      });
    }

    return { leftBays: left, rightBays: right };
  }, [selectedFloor]);

  const activeSlotId = selectedSlot || (deckSlots.leftBays.find(s => s.isAvailable)?.id || deckSlots.rightBays.find(s => s.isAvailable)?.id || null);

  return (
    <View style={styles.container}>
      {/* 1. Header Toolbar with Facility Info & Live Overhead Sensors Tag */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.liveTagRow}>
            <View style={styles.sensorDot} />
            <Text style={styles.liveTagText}>SMART DECK SENSORS • REAL-TIME</Text>
          </View>
          <Text style={styles.hubTitle} numberOfLines={1}>
            {buildingName || 'Multi-Deck Facility'}
          </Text>
        </View>

        <View style={styles.sensorStatusBox}>
          <Text style={styles.sensorStatusLabel}>FLOOR SENSORS</Text>
          <Text style={styles.sensorStatusValue}>
            {selectedFloor ? `${selectedFloor.availableSlots} FREE` : 'READY'}
          </Text>
        </View>
      </View>

      {/* 2. Floor Level Switcher Pills */}
      <View style={styles.levelSelectorContainer}>
        <Text style={styles.levelSelectorLabel}>LEVEL:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelScroll}>
          {floors.map((floor) => {
            const isSelected = selectedFloor?._id === floor._id;
            const isFull = floor.availableSlots <= 0;
            return (
              <TouchableOpacity
                key={floor._id}
                style={[
                  styles.levelPill,
                  isSelected && styles.levelPillActive,
                  isFull && styles.levelPillFull,
                ]}
                onPress={() => {
                  if (!isFull) {
                    onSelectFloor(floor);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.levelPillText, isSelected && styles.levelPillTextActive]}>
                  {floor.floorName}
                </Text>
                <View
                  style={[
                    styles.levelPillDot,
                    {
                      backgroundColor: isFull
                        ? '#EF4444'
                        : floor.availableSlots > 10
                        ? '#22C55E'
                        : '#F59E0B',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. The Real Parking Deck Map (SVG) */}
      <View style={styles.mapCanvasWrapper}>
        <Svg width={PLAN_WIDTH} height={PLAN_HEIGHT} viewBox={`0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}`}>
          <Defs>
            {/* Asphalt Texture */}
            <LinearGradient id="asphaltGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#181D26" />
              <Stop offset="50%" stopColor="#12161F" />
              <Stop offset="100%" stopColor="#0E121A" />
            </LinearGradient>
            {/* Drive Aisle Lane Gradient */}
            <LinearGradient id="driveAisleGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1E2532" />
              <Stop offset="100%" stopColor="#171C26" />
            </LinearGradient>
            {/* Bay Available Green Glow */}
            <RadialGradient id="bayFreeGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
            </RadialGradient>
            {/* Bay Selected Drivix Yellow Glow */}
            <RadialGradient id="baySelectedGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFC928" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#FFC928" stopOpacity="0.05" />
            </RadialGradient>
            {/* Pedestrian Crossing Stripes */}
            <LinearGradient id="zebraStripes" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </LinearGradient>
          </Defs>

          {/* Concrete Floor Perimeter Deck */}
          <Rect
            x={10}
            y={10}
            width={PLAN_WIDTH - 20}
            height={PLAN_HEIGHT - 20}
            rx={16}
            fill="url(#asphaltGrad)"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
          />

          {/* Central Driving Aisle */}
          <Rect
            x={AISLE_X}
            y={12}
            width={AISLE_WIDTH}
            height={PLAN_HEIGHT - 24}
            fill="url(#driveAisleGrad)"
          />

          {/* Yellow Dashed Center Aisle Line */}
          <Line
            x1={AISLE_X + AISLE_WIDTH / 2}
            y1={24}
            x2={AISLE_X + AISLE_WIDTH / 2}
            y2={PLAN_HEIGHT - 40}
            stroke="#FFC928"
            strokeWidth="2"
            strokeDasharray="8, 6"
            opacity="0.85"
          />

          {/* Entry & Direction Arrows Painted on Asphalt */}
          <G>
            <Path
              d={`M ${AISLE_X + AISLE_WIDTH / 2} 48 L ${AISLE_X + AISLE_WIDTH / 2 - 8} 62 L ${AISLE_X + AISLE_WIDTH / 2 + 8} 62 Z`}
              fill="#FFC928"
              opacity="0.9"
            />
            <SvgText
              x={AISLE_X + AISLE_WIDTH / 2}
              y={76}
              fill="#94A3B8"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              10 KM/H
            </SvgText>

            <Path
              d={`M ${AISLE_X + AISLE_WIDTH / 2} 180 L ${AISLE_X + AISLE_WIDTH / 2 - 8} 194 L ${AISLE_X + AISLE_WIDTH / 2 + 8} 194 Z`}
              fill="#FFC928"
              opacity="0.9"
            />

            <Path
              d={`M ${AISLE_X + AISLE_WIDTH / 2} 310 L ${AISLE_X + AISLE_WIDTH / 2 - 8} 324 L ${AISLE_X + AISLE_WIDTH / 2 + 8} 324 Z`}
              fill="#FFC928"
              opacity="0.9"
            />
          </G>

          {/* Pedestrian Zebra Walkway Corridor at Bottom */}
          <G>
            <Rect
              x={AISLE_X}
              y={PLAN_HEIGHT - 62}
              width={AISLE_WIDTH}
              height={26}
              fill="url(#zebraStripes)"
            />
            {[0, 1, 2, 3, 4].map((n) => (
              <Rect
                key={`zebra_${n}`}
                x={AISLE_X + 6 + n * 12}
                y={PLAN_HEIGHT - 60}
                width={7}
                height={22}
                fill="#FFFFFF"
                opacity="0.25"
                rx={1}
              />
            ))}
          </G>

          {/* Left Column Parking Stalls */}
          {deckSlots.leftBays.map((bay, idx) => {
            const bayY = 24 + idx * (BAY_HEIGHT + 8);
            const isSelected = activeSlotId === bay.id;

            return (
              <G
                key={bay.id}
                onPress={() => {
                  if (bay.isAvailable && onSelectSlot) {
                    onSelectSlot(bay.id);
                  }
                }}
              >
                {/* Stall Bay Rect Surface */}
                <Rect
                  x={LEFT_BAY_X}
                  y={bayY}
                  width={BAY_WIDTH}
                  height={BAY_HEIGHT}
                  rx={6}
                  fill={
                    isSelected
                      ? 'url(#baySelectedGlow)'
                      : bay.isAvailable
                      ? 'url(#bayFreeGlow)'
                      : 'rgba(239, 68, 68, 0.08)'
                  }
                  stroke={
                    isSelected
                      ? '#FFC928'
                      : bay.isAvailable
                      ? '#22C55E'
                      : 'rgba(255, 255, 255, 0.12)'
                  }
                  strokeWidth={isSelected ? '2' : '1.2'}
                />

                {/* Yellow / Black Rubber Tire Stopper Block */}
                <Rect
                  x={LEFT_BAY_X + 4}
                  y={bayY + 6}
                  width={6}
                  height={BAY_HEIGHT - 12}
                  fill="#FFC928"
                  rx={2}
                />
                <Rect
                  x={LEFT_BAY_X + 5}
                  y={bayY + 14}
                  width={4}
                  height={12}
                  fill="#000000"
                />
                <Rect
                  x={LEFT_BAY_X + 5}
                  y={bayY + 36}
                  width={4}
                  height={12}
                  fill="#000000"
                />
                <Rect
                  x={LEFT_BAY_X + 5}
                  y={bayY + 58}
                  width={4}
                  height={12}
                  fill="#000000"
                />

                {/* Stall Code Label (e.g. G-01) */}
                <SvgText
                  x={LEFT_BAY_X + 16}
                  y={bayY + 16}
                  fill={isSelected ? '#FFC928' : bay.isAvailable ? '#22C55E' : '#64748B'}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {bay.code}
                </SvgText>

                {/* Overhead Smart Sensor Dome LED */}
                <Circle
                  cx={LEFT_BAY_X + BAY_WIDTH - 8}
                  cy={bayY + 12}
                  r={4.5}
                  fill={
                    isSelected
                      ? '#FFC928'
                      : bay.isAvailable
                      ? '#22C55E'
                      : '#EF4444'
                  }
                />

                {/* EV Charging Station Indicator */}
                {bay.isEV && (
                  <G>
                    <Circle
                      cx={LEFT_BAY_X + 18}
                      cy={bayY + BAY_HEIGHT - 16}
                      r={7}
                      fill="#0284C7"
                    />
                    <SvgText
                      x={LEFT_BAY_X + 18}
                      y={bayY + BAY_HEIGHT - 13}
                      fill="#FFFFFF"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ⚡
                    </SvgText>
                  </G>
                )}

                {/* Realistic Top-Down Car if Occupied */}
                {!bay.isAvailable ? (
                  <G>
                    {/* Car Body */}
                    <Rect
                      x={LEFT_BAY_X + 14}
                      y={bayY + 14}
                      width={32}
                      height={64}
                      rx={8}
                      fill={bay.carColor || '#E2E8F0'}
                      stroke="#0F172A"
                      strokeWidth="1"
                    />
                    {/* Front Windshield */}
                    <Rect
                      x={LEFT_BAY_X + 17}
                      y={bayY + 28}
                      width={26}
                      height={10}
                      rx={3}
                      fill="#0F172A"
                    />
                    {/* Rear Windshield */}
                    <Rect
                      x={LEFT_BAY_X + 18}
                      y={bayY + 56}
                      width={24}
                      height={8}
                      rx={3}
                      fill="#0F172A"
                    />
                    {/* Roof */}
                    <Rect
                      x={LEFT_BAY_X + 17}
                      y={bayY + 38}
                      width={26}
                      height={18}
                      rx={2}
                      fill={bay.carColor || '#CBD5E1'}
                      opacity="0.8"
                    />
                    {/* Headlights */}
                    <Circle cx={LEFT_BAY_X + 18} cy={bayY + 16} r={2} fill="#FEF08A" />
                    <Circle cx={LEFT_BAY_X + 42} cy={bayY + 16} r={2} fill="#FEF08A" />
                    {/* Taillights */}
                    <Circle cx={LEFT_BAY_X + 18} cy={bayY + 76} r={1.5} fill="#EF4444" />
                    <Circle cx={LEFT_BAY_X + 42} cy={bayY + 76} r={1.5} fill="#EF4444" />
                  </G>
                ) : (
                  /* Available Slot Badge / Tap Indicator */
                  <G>
                    {isSelected ? (
                      <G>
                        <Rect
                          x={LEFT_BAY_X + 15}
                          y={bayY + 38}
                          width={32}
                          height={20}
                          rx={10}
                          fill="#FFC928"
                        />
                        <SvgText
                          x={LEFT_BAY_X + 31}
                          y={bayY + 51}
                          fill="#171717"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          PICKED
                        </SvgText>
                      </G>
                    ) : (
                      <G>
                        <Circle
                          cx={LEFT_BAY_X + 30}
                          cy={bayY + 48}
                          r={12}
                          fill="rgba(34, 197, 94, 0.15)"
                          stroke="#22C55E"
                          strokeWidth="1"
                        />
                        <SvgText
                          x={LEFT_BAY_X + 30}
                          y={bayY + 51}
                          fill="#22C55E"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          FREE
                        </SvgText>
                      </G>
                    )}
                  </G>
                )}
              </G>
            );
          })}

          {/* Right Column Parking Stalls */}
          {deckSlots.rightBays.map((bay, idx) => {
            const bayY = 24 + idx * (BAY_HEIGHT + 8);
            const isSelected = activeSlotId === bay.id;

            return (
              <G
                key={bay.id}
                onPress={() => {
                  if (bay.isAvailable && onSelectSlot) {
                    onSelectSlot(bay.id);
                  }
                }}
              >
                {/* Stall Bay Rect Surface */}
                <Rect
                  x={RIGHT_BAY_X}
                  y={bayY}
                  width={BAY_WIDTH}
                  height={BAY_HEIGHT}
                  rx={6}
                  fill={
                    isSelected
                      ? 'url(#baySelectedGlow)'
                      : bay.isAvailable
                      ? 'url(#bayFreeGlow)'
                      : 'rgba(239, 68, 68, 0.08)'
                  }
                  stroke={
                    isSelected
                      ? '#FFC928'
                      : bay.isAvailable
                      ? '#22C55E'
                      : 'rgba(255, 255, 255, 0.12)'
                  }
                  strokeWidth={isSelected ? '2' : '1.2'}
                />

                {/* Rubber Tire Stopper Block on Right Outer Edge */}
                <Rect
                  x={RIGHT_BAY_X + BAY_WIDTH - 10}
                  y={bayY + 6}
                  width={6}
                  height={BAY_HEIGHT - 12}
                  fill="#FFC928"
                  rx={2}
                />
                <Rect
                  x={RIGHT_BAY_X + BAY_WIDTH - 9}
                  y={bayY + 14}
                  width={4}
                  height={12}
                  fill="#000000"
                />
                <Rect
                  x={RIGHT_BAY_X + BAY_WIDTH - 9}
                  y={bayY + 36}
                  width={4}
                  height={12}
                  fill="#000000"
                />
                <Rect
                  x={RIGHT_BAY_X + BAY_WIDTH - 9}
                  y={bayY + 58}
                  width={4}
                  height={12}
                  fill="#000000"
                />

                {/* Stall Code Label */}
                <SvgText
                  x={RIGHT_BAY_X + BAY_WIDTH - 32}
                  y={bayY + 16}
                  fill={isSelected ? '#FFC928' : bay.isAvailable ? '#22C55E' : '#64748B'}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {bay.code}
                </SvgText>

                {/* Overhead Smart Sensor Dome LED */}
                <Circle
                  cx={RIGHT_BAY_X + 8}
                  cy={bayY + 12}
                  r={4.5}
                  fill={
                    isSelected
                      ? '#FFC928'
                      : bay.isAvailable
                      ? '#22C55E'
                      : '#EF4444'
                  }
                />

                {/* Accessible Handicap Icon if supported */}
                {bay.isAccessible && (
                  <G>
                    <Circle
                      cx={RIGHT_BAY_X + BAY_WIDTH - 20}
                      cy={bayY + BAY_HEIGHT - 16}
                      r={7}
                      fill="#1E40AF"
                    />
                    <SvgText
                      x={RIGHT_BAY_X + BAY_WIDTH - 20}
                      y={bayY + BAY_HEIGHT - 13}
                      fill="#FFFFFF"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ♿
                    </SvgText>
                  </G>
                )}

                {/* EV icon if supported */}
                {bay.isEV && (
                  <G>
                    <Circle
                      cx={RIGHT_BAY_X + BAY_WIDTH - 20}
                      cy={bayY + BAY_HEIGHT - 16}
                      r={7}
                      fill="#0284C7"
                    />
                    <SvgText
                      x={RIGHT_BAY_X + BAY_WIDTH - 20}
                      y={bayY + BAY_HEIGHT - 13}
                      fill="#FFFFFF"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ⚡
                    </SvgText>
                  </G>
                )}

                {/* Realistic Top-Down Car if Occupied */}
                {!bay.isAvailable ? (
                  <G>
                    <Rect
                      x={RIGHT_BAY_X + 6}
                      y={bayY + 14}
                      width={32}
                      height={64}
                      rx={8}
                      fill={bay.carColor || '#64748B'}
                      stroke="#0F172A"
                      strokeWidth="1"
                    />
                    <Rect
                      x={RIGHT_BAY_X + 9}
                      y={bayY + 28}
                      width={26}
                      height={10}
                      rx={3}
                      fill="#0F172A"
                    />
                    <Rect
                      x={RIGHT_BAY_X + 10}
                      y={bayY + 56}
                      width={24}
                      height={8}
                      rx={3}
                      fill="#0F172A"
                    />
                    <Rect
                      x={RIGHT_BAY_X + 9}
                      y={bayY + 38}
                      width={26}
                      height={18}
                      rx={2}
                      fill={bay.carColor || '#475569'}
                      opacity="0.8"
                    />
                    <Circle cx={RIGHT_BAY_X + 10} cy={bayY + 16} r={2} fill="#FEF08A" />
                    <Circle cx={RIGHT_BAY_X + 34} cy={bayY + 16} r={2} fill="#FEF08A" />
                    <Circle cx={RIGHT_BAY_X + 10} cy={bayY + 76} r={1.5} fill="#EF4444" />
                    <Circle cx={RIGHT_BAY_X + 34} cy={bayY + 76} r={1.5} fill="#EF4444" />
                  </G>
                ) : (
                  <G>
                    {isSelected ? (
                      <G>
                        <Rect
                          x={RIGHT_BAY_X + 5}
                          y={bayY + 38}
                          width={32}
                          height={20}
                          rx={10}
                          fill="#FFC928"
                        />
                        <SvgText
                          x={RIGHT_BAY_X + 21}
                          y={bayY + 51}
                          fill="#171717"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          PICKED
                        </SvgText>
                      </G>
                    ) : (
                      <G>
                        <Circle
                          cx={RIGHT_BAY_X + 22}
                          cy={bayY + 48}
                          r={12}
                          fill="rgba(34, 197, 94, 0.15)"
                          stroke="#22C55E"
                          strokeWidth="1"
                        />
                        <SvgText
                          x={RIGHT_BAY_X + 22}
                          y={bayY + 51}
                          fill="#22C55E"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          FREE
                        </SvgText>
                      </G>
                    )}
                  </G>
                )}
              </G>
            );
          })}
        </Svg>
      </View>

      {/* 4. Selected Slot Callout Pill */}
      {activeSlotId && (
        <View style={styles.pickedSpotBanner}>
          <View style={styles.pickedSpotLeft}>
            <View style={styles.spotGoldBadge}>
              <Text style={styles.spotGoldBadgeText}>{activeSlotId}</Text>
            </View>
            <View>
              <Text style={styles.spotTitle}>Spot {activeSlotId} Selected</Text>
              <Text style={styles.spotSubtitle}>
                Level {selectedFloor?.floorName || 'Ground'} • Near Lift Core A
              </Text>
            </View>
          </View>
          <View style={styles.confirmedPill}>
            <CheckCircle2 size={14} color="#15803D" />
            <Text style={styles.confirmedPillText}>Ready</Text>
          </View>
        </View>
      )}

      {/* 5. Clean Deck Legend Footer */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <Circle cx={4} cy={4} r={4} fill="#22C55E" />
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Available Spot</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Occupied Car</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFC928' }]} />
          <Text style={styles.legendText}>Selected Spot</Text>
        </View>

        <View style={styles.legendItem}>
          <Zap size={11} color="#0284C7" />
          <Text style={styles.legendText}>EV Ready</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D111A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.3)',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sensorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFC928',
    letterSpacing: 0.7,
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sensorStatusBox: {
    alignItems: 'flex-end',
    backgroundColor: '#161D2B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sensorStatusLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  sensorStatusValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#22C55E',
  },
  levelSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  levelSelectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  levelScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161F2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  levelPillActive: {
    backgroundColor: '#FFC928',
    borderColor: '#FFC928',
  },
  levelPillFull: {
    opacity: 0.45,
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  levelPillTextActive: {
    color: '#171717',
    fontWeight: '800',
  },
  levelPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mapCanvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070A0F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  pickedSpotBanner: {
    marginTop: 12,
    backgroundColor: '#161F2E',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.35)',
  },
  pickedSpotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spotGoldBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotGoldBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171717',
  },
  spotTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  spotSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
