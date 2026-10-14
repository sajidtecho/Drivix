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
  Polygon,
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
  Layers,
  Zap,
  Accessibility,
  Eye,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Compass,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { ParkingFloor, ParkingSlot } from '../../types';

interface ParkingBuilding3DVisualizerProps {
  floors: ParkingFloor[];
  selectedFloor: ParkingFloor | null;
  onSelectFloor: (floor: ParkingFloor) => void;
  selectedSlot?: string | null;
  onSelectSlot?: (slotId: string) => void;
  buildingName?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SVG_WIDTH = Math.min(SCREEN_WIDTH - 32, 420);
const SVG_HEIGHT = 380;
const CENTER_X = SVG_WIDTH / 2;

// Isometric math constants
const SLAB_W = SVG_WIDTH * 0.62; // width across
const SLAB_D = SVG_WIDTH * 0.32; // depth
const SLAB_H = 14; // thickness of slab

export const ParkingBuilding3DVisualizer: React.FC<ParkingBuilding3DVisualizerProps> = ({
  floors,
  selectedFloor,
  onSelectFloor,
  selectedSlot,
  onSelectSlot,
  buildingName,
}) => {
  const [viewMode, setViewMode] = useState<'stack' | 'exploded' | 'slots'>('stack');
  const [activeAngle, setActiveAngle] = useState<'isometric' | 'steep'>('isometric');

  // Sort floors from ground (0) to top
  const sortedFloors = useMemo(() => {
    if (!floors || floors.length === 0) return [];
    return [...floors].reverse(); // Render from ground up (or top-down for correct SVG z-order)
  }, [floors]);

  // Total facility stats
  const totalSlots = floors.reduce((acc, f) => acc + (f.totalSlots || 0), 0);
  const totalAvailable = floors.reduce((acc, f) => acc + (f.availableSlots || 0), 0);
  const totalOccupancyPct = totalSlots > 0 ? Math.round(((totalSlots - totalAvailable) / totalSlots) * 100) : 0;

  // Floor layout slots mock generator for drill-down view
  const currentFloorSlots = useMemo(() => {
    if (!selectedFloor) return [];
    const count = 12; // 12 visual interactive slots for the floor
    const freeCount = Math.min(count, Math.max(2, Math.round((selectedFloor.availableSlots / (selectedFloor.totalSlots || 1)) * count)));
    const evSlots = selectedFloor.evSlots || 1;
    
    const slots = [];
    for (let i = 1; i <= count; i++) {
      const isEv = i <= evSlots;
      const isAvailable = i <= freeCount;
      const code = `${selectedFloor.floorName?.charAt(0) || 'L'}-${String(i).padStart(2, '0')}`;
      slots.push({
        id: code,
        slotNumber: code,
        isAvailable,
        isEv,
        isAccessible: i === count,
      });
    }
    return slots;
  }, [selectedFloor]);

  // Compute vertical baseline for each floor
  const floorSpacing = viewMode === 'exploded' ? 72 : 46;
  const baseY = SVG_HEIGHT - 65;

  return (
    <View style={styles.container}>
      {/* Visualizer Header with Mode Toggles */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveTagText}>3D DIGITAL TWIN</Text>
          </View>
          <Text style={styles.buildingTitle} numberOfLines={1}>
            {buildingName || 'Multi-Level Parking Facility'}
          </Text>
        </View>

        {/* View Mode Segmented Switch */}
        <View style={styles.segmentControls}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'stack' && styles.segmentBtnActive]}
            onPress={() => setViewMode('stack')}
            activeOpacity={0.7}
          >
            <Layers size={14} color={viewMode === 'stack' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.segmentBtnText, viewMode === 'stack' && styles.segmentBtnTextActive]}>
              3D
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'exploded' && styles.segmentBtnActive]}
            onPress={() => setViewMode('exploded')}
            activeOpacity={0.7}
          >
            <Maximize2 size={14} color={viewMode === 'exploded' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.segmentBtnText, viewMode === 'exploded' && styles.segmentBtnTextActive]}>
              Expand
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'slots' && styles.segmentBtnActive]}
            onPress={() => setViewMode('slots')}
            activeOpacity={0.7}
          >
            <Eye size={14} color={viewMode === 'slots' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.segmentBtnText, viewMode === 'slots' && styles.segmentBtnTextActive]}>
              Slots
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main 3D Canvas Container */}
      <View style={styles.canvasContainer}>
        {viewMode === 'slots' ? (
          /* =======================================================
             DETAILED ISOMETRIC FLOOR SLOT MAP (Interactive Bays)
             ======================================================= */
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
            <Defs>
              <LinearGradient id="floorGridGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#1E232E" stopOpacity="0.95" />
                <Stop offset="100%" stopColor="#11151D" stopOpacity="0.98" />
              </LinearGradient>
              <LinearGradient id="driveLaneGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#2A3040" />
                <Stop offset="50%" stopColor="#353E52" />
                <Stop offset="100%" stopColor="#2A3040" />
              </LinearGradient>
              <LinearGradient id="carBodyGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#E2E8F0" />
                <Stop offset="100%" stopColor="#64748B" />
              </LinearGradient>
              <LinearGradient id="evCarGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#38BDF8" />
                <Stop offset="100%" stopColor="#0284C7" />
              </LinearGradient>
            </Defs>

            {/* Background Ground Grid / Floor Slab */}
            {/* Floor Isometric Base */}
            <Polygon
              points={`
                ${CENTER_X},${45}
                ${CENTER_X + SLAB_W * 0.72},${45 + SLAB_D * 0.8}
                ${CENTER_X},${45 + SLAB_D * 1.6}
                ${CENTER_X - SLAB_W * 0.72},${45 + SLAB_D * 0.8}
              `}
              fill="url(#floorGridGrad)"
              stroke="#FFC928"
              strokeWidth="2"
            />

            {/* Front Extrusion of the Floor */}
            <Polygon
              points={`
                ${CENTER_X - SLAB_W * 0.72},${45 + SLAB_D * 0.8}
                ${CENTER_X},${45 + SLAB_D * 1.6}
                ${CENTER_X},${45 + SLAB_D * 1.6 + 18}
                ${CENTER_X - SLAB_W * 0.72},${45 + SLAB_D * 0.8 + 18}
              `}
              fill="#0D1117"
            />
            <Polygon
              points={`
                ${CENTER_X},${45 + SLAB_D * 1.6}
                ${CENTER_X + SLAB_W * 0.72},${45 + SLAB_D * 0.8}
                ${CENTER_X + SLAB_W * 0.72},${45 + SLAB_D * 0.8 + 18}
                ${CENTER_X},${45 + SLAB_D * 1.6 + 18}
              `}
              fill="#161B22"
            />

            {/* Central Drive Lane with Arrows */}
            <Polygon
              points={`
                ${CENTER_X - 18},${70}
                ${CENTER_X + 18},${70}
                ${CENTER_X + 22},${45 + SLAB_D * 1.4}
                ${CENTER_X - 22},${45 + SLAB_D * 1.4}
              `}
              fill="url(#driveLaneGrad)"
            />

            {/* Driveway Direction Arrows */}
            <Path
              d={`M ${CENTER_X} ${100} L ${CENTER_X - 6} ${112} L ${CENTER_X + 6} ${112} Z`}
              fill="#FFC928"
              opacity="0.85"
            />
            <Path
              d={`M ${CENTER_X} ${145} L ${CENTER_X - 6} ${157} L ${CENTER_X + 6} ${157} Z`}
              fill="#FFC928"
              opacity="0.85"
            />
            <Path
              d={`M ${CENTER_X} ${190} L ${CENTER_X - 6} ${202} L ${CENTER_X + 6} ${202} Z`}
              fill="#FFC928"
              opacity="0.85"
            />

            {/* Left Row of Parking Bays */}
            {currentFloorSlots.slice(0, 6).map((slot, index) => {
              const yOffset = 78 + index * 26;
              const xOffset = CENTER_X - 35 - (index * 13);
              const isSelected = selectedSlot === slot.id;

              return (
                <G
                  key={slot.id}
                  onPress={() => slot.isAvailable && onSelectSlot && onSelectSlot(slot.id)}
                >
                  {/* Slot Bay Outline */}
                  <Polygon
                    points={`
                      ${xOffset},${yOffset}
                      ${xOffset - 42},${yOffset + 14}
                      ${xOffset - 42},${yOffset + 32}
                      ${xOffset},${yOffset + 18}
                    `}
                    fill={
                      isSelected
                        ? '#FFC928'
                        : slot.isAvailable
                        ? 'rgba(34, 197, 94, 0.22)'
                        : 'rgba(239, 68, 68, 0.2)'
                    }
                    stroke={
                      isSelected
                        ? '#FFC928'
                        : slot.isAvailable
                        ? '#22C55E'
                        : '#EF4444'
                    }
                    strokeWidth={isSelected ? '2' : '1'}
                  />

                  {/* Slot Status Car or Code */}
                  {slot.isAvailable ? (
                    <SvgText
                      x={xOffset - 22}
                      y={yOffset + 24}
                      fill={isSelected ? '#171717' : '#22C55E'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {slot.slotNumber}
                    </SvgText>
                  ) : (
                    /* Low-poly Parked Isometric Car */
                    <G>
                      <Polygon
                        points={`
                          ${xOffset - 8},${yOffset + 14}
                          ${xOffset - 32},${yOffset + 22}
                          ${xOffset - 28},${yOffset + 28}
                          ${xOffset - 4},${yOffset + 20}
                        `}
                        fill={slot.isEv ? 'url(#evCarGrad)' : 'url(#carBodyGrad)'}
                      />
                      {/* Car windshield */}
                      <Polygon
                        points={`
                          ${xOffset - 14},${yOffset + 16}
                          ${xOffset - 26},${yOffset + 20}
                          ${xOffset - 24},${yOffset + 24}
                          ${xOffset - 12},${yOffset + 20}
                        `}
                        fill="#0F172A"
                      />
                    </G>
                  )}
                </G>
              );
            })}

            {/* Right Row of Parking Bays */}
            {currentFloorSlots.slice(6, 12).map((slot, index) => {
              const yOffset = 78 + index * 26;
              const xOffset = CENTER_X + 35 + (index * 13);
              const isSelected = selectedSlot === slot.id;

              return (
                <G
                  key={slot.id}
                  onPress={() => slot.isAvailable && onSelectSlot && onSelectSlot(slot.id)}
                >
                  {/* Slot Bay Outline */}
                  <Polygon
                    points={`
                      ${xOffset},${yOffset}
                      ${xOffset + 42},${yOffset + 14}
                      ${xOffset + 42},${yOffset + 32}
                      ${xOffset},${yOffset + 18}
                    `}
                    fill={
                      isSelected
                        ? '#FFC928'
                        : slot.isAvailable
                        ? 'rgba(34, 197, 94, 0.22)'
                        : 'rgba(239, 68, 68, 0.2)'
                    }
                    stroke={
                      isSelected
                        ? '#FFC928'
                        : slot.isAvailable
                        ? '#22C55E'
                        : '#EF4444'
                    }
                    strokeWidth={isSelected ? '2' : '1'}
                  />

                  {slot.isAvailable ? (
                    <SvgText
                      x={xOffset + 22}
                      y={yOffset + 24}
                      fill={isSelected ? '#171717' : '#22C55E'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {slot.slotNumber}
                    </SvgText>
                  ) : (
                    /* Parked Isometric Car */
                    <G>
                      <Polygon
                        points={`
                          ${xOffset + 8},${yOffset + 14}
                          ${xOffset + 32},${yOffset + 22}
                          ${xOffset + 28},${yOffset + 28}
                          ${xOffset + 4},${yOffset + 20}
                        `}
                        fill={slot.isEv ? 'url(#evCarGrad)' : 'url(#carBodyGrad)'}
                      />
                      <Polygon
                        points={`
                          ${xOffset + 14},${yOffset + 16}
                          ${xOffset + 26},${yOffset + 20}
                          ${xOffset + 24},${yOffset + 24}
                          ${xOffset + 12},${yOffset + 20}
                        `}
                        fill="#0F172A"
                      />
                    </G>
                  )}
                </G>
              );
            })}

            {/* Floor Name Plaque Header */}
            <Rect
              x={CENTER_X - 70}
              y={240}
              width={140}
              height={26}
              rx={13}
              fill="#171717"
              stroke="#FFC928"
              strokeWidth="1.5"
            />
            <SvgText
              x={CENTER_X}
              y={257}
              fill="#FFC928"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              {selectedFloor?.floorName || 'Floor'} Layout
            </SvgText>
          </Svg>
        ) : (
          /* =======================================================
             3D ISOMETRIC BUILDING STACK (Floors & Architectural Slabs)
             ======================================================= */
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
            <Defs>
              <LinearGradient id="groundGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#1E232E" />
                <Stop offset="100%" stopColor="#0B0E14" />
              </LinearGradient>
              <LinearGradient id="slabTopGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#283040" />
                <Stop offset="100%" stopColor="#19202C" />
              </LinearGradient>
              <LinearGradient id="slabSelectedTopGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#3F3715" />
                <Stop offset="100%" stopColor="#241E09" />
              </LinearGradient>
              <LinearGradient id="pillarGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#64748B" />
                <Stop offset="100%" stopColor="#334155" />
              </LinearGradient>
              <RadialGradient id="selectionGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFC928" stopOpacity="0.45" />
                <Stop offset="100%" stopColor="#FFC928" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Base Apron / Ground Driveway */}
            <Polygon
              points={`
                ${CENTER_X},${baseY - 12}
                ${CENTER_X + SLAB_W * 0.65},${baseY + SLAB_D * 0.58}
                ${CENTER_X},${baseY + SLAB_D * 1.15}
                ${CENTER_X - SLAB_W * 0.65},${baseY + SLAB_D * 0.58}
              `}
              fill="url(#groundGrad)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
            />

            {/* Ground Entrance Barrier Gate */}
            <G>
              {/* Barrier stand */}
              <Rect
                x={CENTER_X - SLAB_W * 0.42}
                y={baseY + SLAB_D * 0.5 - 16}
                width={7}
                height={16}
                fill="#FFC928"
                rx={1}
              />
              {/* Gate barrier arm */}
              <Line
                x1={CENTER_X - SLAB_W * 0.42 + 7}
                y1={baseY + SLAB_D * 0.5 - 12}
                x2={CENTER_X - SLAB_W * 0.42 + 32}
                y2={baseY + SLAB_D * 0.5 - 4}
                stroke="#EF4444"
                strokeWidth={3}
                strokeDasharray="4, 4"
              />
              {/* LED signal indicator */}
              <Circle
                cx={CENTER_X - SLAB_W * 0.42 + 3.5}
                y={baseY + SLAB_D * 0.5 - 19}
                r={3}
                fill="#22C55E"
              />
            </G>

            {/* Structural Connecting Pillars */}
            {sortedFloors.length > 1 && (
              <G>
                {/* Back Left Pillar */}
                <Line
                  x1={CENTER_X - SLAB_W * 0.38}
                  y1={baseY - (sortedFloors.length - 1) * floorSpacing}
                  x2={CENTER_X - SLAB_W * 0.38}
                  y2={baseY + 10}
                  stroke="url(#pillarGrad)"
                  strokeWidth="3.5"
                />
                {/* Back Right Pillar */}
                <Line
                  x1={CENTER_X + SLAB_W * 0.38}
                  y1={baseY - (sortedFloors.length - 1) * floorSpacing}
                  x2={CENTER_X + SLAB_W * 0.38}
                  y2={baseY + 10}
                  stroke="url(#pillarGrad)"
                  strokeWidth="3.5"
                />
              </G>
            )}

            {/* Render Each Floor Slab */}
            {sortedFloors.map((floor, index) => {
              const isSelected = selectedFloor?._id === floor._id;
              const isFull = floor.availableSlots <= 0;
              const occupancy = floor.totalSlots > 0
                ? Math.round(((floor.totalSlots - floor.availableSlots) / floor.totalSlots) * 100)
                : 0;

              // Color coding based on capacity
              const glowColor = isSelected
                ? '#FFC928'
                : isFull
                ? '#EF4444'
                : occupancy > 80
                ? '#F59E0B'
                : '#22C55E';

              // Vertical position with elevation when selected
              const elevationLift = isSelected ? 18 : 0;
              const curY = baseY - index * floorSpacing - elevationLift;

              // Slab coordinates
              const topP = `${CENTER_X},${curY - SLAB_D / 2}`;
              const rightP = `${CENTER_X + SLAB_W / 2},${curY}`;
              const bottomP = `${CENTER_X},${curY + SLAB_D / 2}`;
              const leftP = `${CENTER_X - SLAB_W / 2},${curY}`;

              return (
                <G
                  key={floor._id}
                  onPress={() => !isFull && onSelectFloor(floor)}
                >
                  {/* Selection Glow Aura */}
                  {isSelected && (
                    <Polygon
                      points={`
                        ${CENTER_X},${curY - SLAB_D / 2 - 8}
                        ${CENTER_X + SLAB_W / 2 + 12},${curY}
                        ${CENTER_X},${curY + SLAB_D / 2 + 8}
                        ${CENTER_X - SLAB_W / 2 - 12},${curY}
                      `}
                      fill="url(#selectionGlow)"
                    />
                  )}

                  {/* Left Facet (Trapezoid) */}
                  <Polygon
                    points={`
                      ${leftP}
                      ${bottomP}
                      ${CENTER_X},${curY + SLAB_D / 2 + SLAB_H}
                      ${CENTER_X - SLAB_W / 2},${curY + SLAB_H}
                    `}
                    fill={isSelected ? '#71530A' : '#141822'}
                    stroke={glowColor}
                    strokeWidth={isSelected ? '1.5' : '0.8'}
                  />

                  {/* Right Facet (Trapezoid) */}
                  <Polygon
                    points={`
                      ${bottomP}
                      ${rightP}
                      ${CENTER_X + SLAB_W / 2},${curY + SLAB_H}
                      ${CENTER_X},${curY + SLAB_D / 2 + SLAB_H}
                    `}
                    fill={isSelected ? '#543F07' : '#1E2534'}
                    stroke={glowColor}
                    strokeWidth={isSelected ? '1.5' : '0.8'}
                  />

                  {/* Top Slab Surface (Rhombus) */}
                  <Polygon
                    points={`${topP} ${rightP} ${bottomP} ${leftP}`}
                    fill={isSelected ? 'url(#slabSelectedTopGrad)' : 'url(#slabTopGrad)'}
                    stroke={glowColor}
                    strokeWidth={isSelected ? '2.5' : '1.2'}
                  />

                  {/* Grid Lines on Floor Surface for Parking Bays */}
                  <Line
                    x1={CENTER_X - SLAB_W * 0.28}
                    y1={curY - SLAB_D * 0.14}
                    x2={CENTER_X + SLAB_W * 0.18}
                    y2={curY + SLAB_D * 0.22}
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeDasharray="4, 4"
                    strokeWidth="1"
                  />
                  <Line
                    x1={CENTER_X - SLAB_W * 0.18}
                    y1={curY + SLAB_D * 0.22}
                    x2={CENTER_X + SLAB_W * 0.28}
                    y2={curY - SLAB_D * 0.14}
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeDasharray="4, 4"
                    strokeWidth="1"
                  />

                  {/* Micro Parked Car on Available Floors */}
                  {!isFull && (
                    <G>
                      <Polygon
                        points={`
                          ${CENTER_X - 18},${curY - 2}
                          ${CENTER_X - 2},${curY + 6}
                          ${CENTER_X + 12},${curY - 1}
                          ${CENTER_X - 4},${curY - 9}
                        `}
                        fill={floor.evSlots ? '#38BDF8' : '#F1F5F9'}
                      />
                      {/* Car glass */}
                      <Polygon
                        points={`
                          ${CENTER_X - 12},${curY - 3}
                          ${CENTER_X - 4},${curY + 2}
                          ${CENTER_X + 4},${curY - 2}
                          ${CENTER_X - 4},${curY - 7}
                        `}
                        fill="#0F172A"
                      />
                    </G>
                  )}

                  {/* Floor Level Floating Tag on Right Side */}
                  <G>
                    {/* Tag Background Pill */}
                    <Rect
                      x={CENTER_X + SLAB_W / 2 + 12}
                      y={curY - 14}
                      width={86}
                      height={26}
                      rx={13}
                      fill={isSelected ? '#FFC928' : '#171717'}
                      stroke={glowColor}
                      strokeWidth={isSelected ? '2' : '1'}
                    />
                    {/* Floor Label */}
                    <SvgText
                      x={CENTER_X + SLAB_W / 2 + 24}
                      y={curY + 3}
                      fill={isSelected ? '#171717' : '#FFFFFF'}
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {floor.floorName}
                    </SvgText>
                    {/* Capacity Indicator Dot */}
                    <Circle
                      cx={CENTER_X + SLAB_W / 2 + 82}
                      cy={curY - 1}
                      r={4}
                      fill={glowColor}
                    />
                  </G>

                  {/* EV Lightning icon indicator on left */}
                  {Boolean(floor.evSlots) && (
                    <G>
                      <Circle
                        cx={CENTER_X - SLAB_W / 2 - 16}
                        cy={curY}
                        r={11}
                        fill="#0284C7"
                      />
                      <Path
                        d={`
                          M ${CENTER_X - SLAB_W / 2 - 14} ${curY - 6}
                          L ${CENTER_X - SLAB_W / 2 - 18} ${curY + 1}
                          L ${CENTER_X - SLAB_W / 2 - 15} ${curY + 1}
                          L ${CENTER_X - SLAB_W / 2 - 18} ${curY + 6}
                          L ${CENTER_X - SLAB_W / 2 - 12} ${curY - 1}
                          L ${CENTER_X - SLAB_W / 2 - 15} ${curY - 1}
                          Z
                        `}
                        fill="#FFFFFF"
                      />
                    </G>
                  )}
                </G>
              );
            })}
          </Svg>
        )}
      </View>

      {/* Interactive Selected Floor Detail Inspection Bar */}
      {selectedFloor && (
        <View style={styles.floorDetailCard}>
          <View style={styles.floorDetailHeader}>
            <View style={styles.detailBadgeRow}>
              <View style={styles.detailLevelBadge}>
                <Text style={styles.detailLevelBadgeText}>{selectedFloor.floorName}</Text>
              </View>
              <View>
                <Text style={styles.detailTitle}>Level {selectedFloor.floorName}</Text>
                <Text style={styles.detailCapacitySub}>
                  {selectedFloor.availableSlots} of {selectedFloor.totalSlots} Slots Free
                </Text>
              </View>
            </View>

            <View style={[
              styles.occupancyStatusPill,
              selectedFloor.availableSlots <= 0
                ? styles.pillFull
                : selectedFloor.availableSlots > 10
                ? styles.pillAvailable
                : styles.pillBusy
            ]}>
              <Text style={[
                styles.occupancyStatusText,
                selectedFloor.availableSlots <= 0
                  ? styles.textFull
                  : selectedFloor.availableSlots > 10
                  ? styles.textAvailable
                  : styles.textBusy
              ]}>
                {selectedFloor.availableSlots <= 0
                  ? 'FULL'
                  : `${Math.round(((selectedFloor.totalSlots - selectedFloor.availableSlots) / (selectedFloor.totalSlots || 1)) * 100)}% OCCUPIED`}
              </Text>
            </View>
          </View>

          {/* Quick Metrics Chips */}
          <View style={styles.metricsRow}>
            {Boolean(selectedFloor.evSlots) && (
              <View style={styles.metricChip}>
                <Zap size={13} color="#0284C7" />
                <Text style={styles.metricChipText}>{selectedFloor.evSlots} EV Fast Bays</Text>
              </View>
            )}
            {Boolean(selectedFloor.accessibilitySlots) && (
              <View style={styles.metricChip}>
                <Accessibility size={13} color="#1E40AF" />
                <Text style={styles.metricChipText}>Accessible Bays</Text>
              </View>
            )}
            <View style={styles.metricChip}>
              <CheckCircle2 size={13} color="#16A34A" />
              <Text style={styles.metricChipText}>Auto-Assigned at Barrier</Text>
            </View>
          </View>
        </View>
      )}

      {/* Visualizer Legend Footer */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Filling</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Full</Text>
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
    backgroundColor: '#0F1219',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.25)',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFC928',
    letterSpacing: 0.8,
  },
  buildingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  segmentControls: {
    flexDirection: 'row',
    backgroundColor: '#1C2230',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFC928',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  segmentBtnTextActive: {
    color: '#171717',
  },
  canvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0D13',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  floorDetailCard: {
    marginTop: 14,
    backgroundColor: '#161B26',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.3)',
  },
  floorDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLevelBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLevelBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailCapacitySub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  occupancyStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22C55E',
  },
  pillBusy: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  pillFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  occupancyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textAvailable: {
    color: '#22C55E',
  },
  textBusy: {
    color: '#F59E0B',
  },
  textFull: {
    color: '#EF4444',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricChipText: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
