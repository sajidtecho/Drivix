import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
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
  Maximize2,
  CheckCircle2,
  RotateCw,
  Compass,
  Car,
  ShieldCheck,
  ArrowUpRight,
  Info,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { ParkingFloor } from '../../types';

interface ParkingBuilding3DVisualizerProps {
  floors: ParkingFloor[];
  selectedFloor: ParkingFloor | null;
  onSelectFloor: (floor: ParkingFloor) => void;
  selectedSlot?: string | null;
  onSelectSlot?: (slotId: string) => void;
  buildingName?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = Math.min(SCREEN_WIDTH - 36, 400);
const CANVAS_HEIGHT = 370;
const CX = CANVAS_WIDTH / 2;

// Isometric Deck Dimensions
const DECK_W = CANVAS_WIDTH * 0.60;  // 240px wide
const DECK_D = CANVAS_WIDTH * 0.28;  // 112px deep
const DECK_H = 12;                   // 12px slab thickness
const RAIL_H = 10;                   // 10px glass parapet height

export const ParkingBuilding3DVisualizer: React.FC<ParkingBuilding3DVisualizerProps> = ({
  floors,
  selectedFloor,
  onSelectFloor,
  selectedSlot,
  onSelectSlot,
  buildingName,
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'slots' | 'specs'>('model');
  const [isExploded, setIsExploded] = useState<boolean>(false);

  // Sort floors logically from Ground (bottom) to Top
  const floorList = useMemo(() => {
    if (!floors || floors.length === 0) return [];
    // Ensure Ground/L1 is floor 0, Top floor is last index
    return [...floors].reverse();
  }, [floors]);

  // Overall building statistics
  const totalSlots = floors.reduce((acc, f) => acc + (f.totalSlots || 0), 0);
  const totalFree = floors.reduce((acc, f) => acc + (f.availableSlots || 0), 0);
  const facilityOccupancy = totalSlots > 0 ? Math.round(((totalSlots - totalFree) / totalSlots) * 100) : 0;

  // Floor layout bays mock generator
  const interactiveSlots = useMemo(() => {
    if (!selectedFloor) return [];
    const count = 10; // 10 spacious interactive slots
    const freeSlotsCount = Math.min(count, Math.max(2, Math.round((selectedFloor.availableSlots / (selectedFloor.totalSlots || 1)) * count)));
    const evSlotsCount = selectedFloor.evSlots || 2;

    const list = [];
    for (let i = 1; i <= count; i++) {
      const code = `${selectedFloor.floorName?.charAt(0) || 'L'}-${String(i).padStart(2, '0')}`;
      list.push({
        id: code,
        slotNumber: code,
        isAvailable: i <= freeSlotsCount,
        isEV: i <= evSlotsCount,
        isAccessible: i === count,
      });
    }
    return list;
  }, [selectedFloor]);

  const spacing = isExploded ? 68 : 44;
  const baseY = CANVAS_HEIGHT - 65;

  return (
    <View style={styles.cardWrapper}>
      {/* Top Futuristic Header */}
      <View style={styles.topBar}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.tagBadge}>
            <View style={styles.radarDot} />
            <Text style={styles.tagText}>ARCHITECTURAL TWIN</Text>
          </View>
          <Text style={styles.hubTitle} numberOfLines={1}>
            {buildingName || 'Multi-Level Smart Hub'}
          </Text>
        </View>

        {/* View Switcher Chips */}
        <View style={styles.tabPillGroup}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'model' && styles.tabPillActive]}
            onPress={() => setActiveTab('model')}
            activeOpacity={0.75}
          >
            <Layers size={13} color={activeTab === 'model' ? '#171717' : '#94A3B8'} />
            <Text style={[styles.tabPillText, activeTab === 'model' && styles.tabPillTextActive]}>
              3D Hub
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'slots' && styles.tabPillActive]}
            onPress={() => setActiveTab('slots')}
            activeOpacity={0.75}
          >
            <Car size={13} color={activeTab === 'slots' ? '#171717' : '#94A3B8'} />
            <Text style={[styles.tabPillText, activeTab === 'slots' && styles.tabPillTextActive]}>
              Deck Plan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'specs' && styles.tabPillActive]}
            onPress={() => setActiveTab('specs')}
            activeOpacity={0.75}
          >
            <Info size={13} color={activeTab === 'specs' ? '#171717' : '#94A3B8'} />
            <Text style={[styles.tabPillText, activeTab === 'specs' && styles.tabPillTextActive]}>
              Specs
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Canvas Viewport */}
      <View style={styles.viewport}>
        {activeTab === 'model' ? (
          /* ============================================================
             1. ISOMETRIC 3D ARCHITECTURAL MULTI-STOREY BUILDING MODEL
             ============================================================ */
          <View style={styles.svgContainer}>
            <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}>
              <Defs>
                {/* Deck Gradients */}
                <LinearGradient id="deckConcreteGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#252D3D" />
                  <Stop offset="50%" stopColor="#1E2430" />
                  <Stop offset="100%" stopColor="#161B24" />
                </LinearGradient>
                <LinearGradient id="deckSelectedGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#3B3213" />
                  <Stop offset="60%" stopColor="#2A230A" />
                  <Stop offset="100%" stopColor="#1C1705" />
                </LinearGradient>
                <LinearGradient id="leftFacetGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#19202C" />
                  <Stop offset="100%" stopColor="#0F141C" />
                </LinearGradient>
                <LinearGradient id="rightFacetGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#131822" />
                  <Stop offset="100%" stopColor="#0A0D14" />
                </LinearGradient>
                {/* Structural Glass Gradients */}
                <LinearGradient id="glassRailGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="rgba(56, 189, 248, 0.35)" />
                  <Stop offset="100%" stopColor="rgba(14, 165, 233, 0.12)" />
                </LinearGradient>
                <LinearGradient id="elevatorGlassGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="rgba(56, 189, 248, 0.45)" />
                  <Stop offset="100%" stopColor="rgba(15, 23, 42, 0.9)" />
                </LinearGradient>
                {/* Gold Highlight Glow */}
                <RadialGradient id="selectionAura" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFC928" stopOpacity="0.4" />
                  <Stop offset="80%" stopColor="#FFC928" stopOpacity="0.05" />
                  <Stop offset="100%" stopColor="#FFC928" stopOpacity="0" />
                </RadialGradient>
              </Defs>

              {/* 1. Ground Apron & Entrance Roadway */}
              <Polygon
                points={`
                  ${CX},${baseY - 10}
                  ${CX + DECK_W * 0.65},${baseY + DECK_D * 0.55}
                  ${CX},${baseY + DECK_D * 1.15}
                  ${CX - DECK_W * 0.65},${baseY + DECK_D * 0.55}
                `}
                fill="#121620"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1.5"
              />

              {/* Ground Entrance Driveway Chevron Arrows */}
              <Path
                d={`M ${CX - 15} ${baseY + DECK_D * 0.75} L ${CX} ${baseY + DECK_D * 0.65} L ${CX + 15} ${baseY + DECK_D * 0.75}`}
                stroke="#FFC928"
                strokeWidth="2"
                fill="none"
                opacity="0.8"
              />
              <Path
                d={`M ${CX - 15} ${baseY + DECK_D * 0.9} L ${CX} ${baseY + DECK_D * 0.8} L ${CX + 15} ${baseY + DECK_D * 0.9}`}
                stroke="#FFC928"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />

              {/* Ground ANPR Gate & Barrier Arm */}
              <G>
                {/* Barrier Stand */}
                <Rect
                  x={CX - DECK_W * 0.45}
                  y={baseY + DECK_D * 0.45 - 14}
                  width={8}
                  height={15}
                  fill="#FFC928"
                  rx={2}
                />
                {/* Boom Arm */}
                <Line
                  x1={CX - DECK_W * 0.45 + 8}
                  y1={baseY + DECK_D * 0.45 - 9}
                  x2={CX - DECK_W * 0.45 + 34}
                  y2={baseY + DECK_D * 0.45 - 2}
                  stroke="#EF4444"
                  strokeWidth="3"
                  strokeDasharray="4, 3"
                />
                {/* Signal Light */}
                <Circle
                  cx={CX - DECK_W * 0.45 + 4}
                  y={baseY + DECK_D * 0.45 - 18}
                  r={3.5}
                  fill="#22C55E"
                />
              </G>

              {/* 2. Glass Elevator Shaft Core (Left Tower) */}
              {floorList.length > 0 && (
                <G>
                  {/* Vertical Elevator Column */}
                  <Rect
                    x={CX - DECK_W * 0.5 - 20}
                    y={baseY - (floorList.length - 1) * spacing - 24}
                    width={16}
                    height={(floorList.length - 1) * spacing + DECK_D * 0.5 + 24}
                    fill="url(#elevatorGlassGrad)"
                    stroke="#0284C7"
                    strokeWidth="1.2"
                    rx={3}
                  />
                  {/* Elevator Cab (Glowing Yellow / Cyan) */}
                  <Rect
                    x={CX - DECK_W * 0.5 - 18}
                    y={baseY - ((selectedFloor ? floorList.findIndex(f => f._id === selectedFloor._id) : 0) * spacing) - 10}
                    width={12}
                    height={16}
                    fill="#FFC928"
                    rx={2}
                  />
                  {/* Elevator Cable */}
                  <Line
                    x1={CX - DECK_W * 0.5 - 12}
                    y1={baseY - (floorList.length - 1) * spacing - 24}
                    x2={CX - DECK_W * 0.5 - 12}
                    y2={baseY}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="1"
                  />
                  {/* Tower Finial */}
                  <Circle
                    cx={CX - DECK_W * 0.5 - 12}
                    y={baseY - (floorList.length - 1) * spacing - 28}
                    r={3}
                    fill="#38BDF8"
                  />
                </G>
              )}

              {/* 3. Spiral Ramp / Helical Access Drive (Right Side) */}
              {floorList.length > 1 && (
                <G>
                  {floorList.map((_, i) => {
                    if (i === floorList.length - 1) return null;
                    const y1 = baseY - i * spacing;
                    const y2 = baseY - (i + 1) * spacing;
                    const rx = CX + DECK_W * 0.48;
                    return (
                      <Path
                        key={`ramp_${i}`}
                        d={`M ${rx} ${y1} Q ${rx + 22} ${(y1 + y2) / 2} ${rx} ${y2}`}
                        stroke="#FFC928"
                        strokeWidth="3.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    );
                  })}
                </G>
              )}

              {/* 4. Structural Columns connecting decks */}
              {floorList.length > 1 && (
                <G>
                  <Line
                    x1={CX - DECK_W * 0.35}
                    y1={baseY - (floorList.length - 1) * spacing}
                    x2={CX - DECK_W * 0.35}
                    y2={baseY + 5}
                    stroke="#475569"
                    strokeWidth="3"
                  />
                  <Line
                    x1={CX + DECK_W * 0.35}
                    y1={baseY - (floorList.length - 1) * spacing}
                    x2={CX + DECK_W * 0.35}
                    y2={baseY + 5}
                    stroke="#334155"
                    strokeWidth="3"
                  />
                </G>
              )}

              {/* 5. Render Floor Slabs (Bottom-to-Top in correct Isometric Z-Order) */}
              {floorList.map((floor, index) => {
                const isSelected = selectedFloor?._id === floor._id;
                const isFull = floor.availableSlots <= 0;
                const occ = floor.totalSlots > 0
                  ? Math.round(((floor.totalSlots - floor.availableSlots) / floor.totalSlots) * 100)
                  : 0;

                // Color accents
                const glow = isSelected
                  ? '#FFC928'
                  : isFull
                  ? '#EF4444'
                  : occ > 80
                  ? '#F59E0B'
                  : '#22C55E';

                // Elevation lift when selected
                const elevation = isSelected ? 16 : 0;
                const curY = baseY - index * spacing - elevation;

                // Key points for isometric deck
                const pTop = `${CX},${curY - DECK_D / 2}`;
                const pRight = `${CX + DECK_W / 2},${curY}`;
                const pBottom = `${CX},${curY + DECK_D / 2}`;
                const pLeft = `${CX - DECK_W / 2},${curY}`;

                return (
                  <G
                    key={floor._id}
                    onPress={() => !isFull && onSelectFloor(floor)}
                  >
                    {/* Floating Selection Spotlight Aura */}
                    {isSelected && (
                      <Polygon
                        points={`
                          ${CX},${curY - DECK_D / 2 - 10}
                          ${CX + DECK_W / 2 + 15},${curY}
                          ${CX},${curY + DECK_D / 2 + 10}
                          ${CX - DECK_W / 2 - 15},${curY}
                        `}
                        fill="url(#selectionAura)"
                      />
                    )}

                    {/* Left Front Facet (Concrete Slab Thickness) */}
                    <Polygon
                      points={`
                        ${pLeft}
                        ${pBottom}
                        ${CX},${curY + DECK_D / 2 + DECK_H}
                        ${CX - DECK_W / 2},${curY + DECK_H}
                      `}
                      fill={isSelected ? '#71530A' : 'url(#leftFacetGrad)'}
                      stroke={glow}
                      strokeWidth={isSelected ? '1.5' : '0.8'}
                    />

                    {/* Right Front Facet (Concrete Slab Thickness) */}
                    <Polygon
                      points={`
                        ${pBottom}
                        ${pRight}
                        ${CX + DECK_W / 2},${curY + DECK_H}
                        ${CX},${curY + DECK_D / 2 + DECK_H}
                      `}
                      fill={isSelected ? '#543F07' : 'url(#rightFacetGrad)'}
                      stroke={glow}
                      strokeWidth={isSelected ? '1.5' : '0.8'}
                    />

                    {/* Top Deck Surface */}
                    <Polygon
                      points={`${pTop} ${pRight} ${pBottom} ${pLeft}`}
                      fill={isSelected ? 'url(#deckSelectedGrad)' : 'url(#deckConcreteGrad)'}
                      stroke={glow}
                      strokeWidth={isSelected ? '2.5' : '1.2'}
                    />

                    {/* Glass Parapet Safety Railing (Front Rim) */}
                    <Polygon
                      points={`
                        ${pLeft}
                        ${pBottom}
                        ${CX},${curY + DECK_D / 2 - RAIL_H}
                        ${CX - DECK_W / 2},${curY - RAIL_H}
                      `}
                      fill="url(#glassRailGrad)"
                      stroke={glow}
                      strokeWidth="0.7"
                      opacity="0.8"
                    />
                    <Polygon
                      points={`
                        ${pBottom}
                        ${pRight}
                        ${CX + DECK_W / 2},${curY - RAIL_H}
                        ${CX},${curY + DECK_D / 2 - RAIL_H}
                      `}
                      fill="url(#glassRailGrad)"
                      stroke={glow}
                      strokeWidth="0.7"
                      opacity="0.8"
                    />

                    {/* Painted Parking Stall Lines on Deck */}
                    <Line
                      x1={CX - DECK_W * 0.24}
                      y1={curY - DECK_D * 0.12}
                      x2={CX - DECK_W * 0.08}
                      y2={curY + DECK_D * 0.18}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeDasharray="3, 3"
                      strokeWidth="1"
                    />
                    <Line
                      x1={CX + DECK_W * 0.08}
                      y1={curY + DECK_D * 0.18}
                      x2={CX + DECK_W * 0.24}
                      y2={curY - DECK_D * 0.12}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeDasharray="3, 3"
                      strokeWidth="1"
                    />

                    {/* Micro Parked Car on Deck */}
                    {!isFull && (
                      <G>
                        <Polygon
                          points={`
                            ${CX - 14},${curY - 1}
                            ${CX},${curY + 7}
                            ${CX + 14},${curY}
                            ${CX},${curY - 8}
                          `}
                          fill={floor.evSlots ? '#38BDF8' : '#E2E8F0'}
                        />
                        {/* Windshield */}
                        <Polygon
                          points={`
                            ${CX - 8},${curY - 2}
                            ${CX},${curY + 3}
                            ${CX + 6},${curY - 1}
                            ${CX},${curY - 6}
                          `}
                          fill="#0F172A"
                        />
                      </G>
                    )}

                    {/* Clean Horizontal Floor Level Badge on Right */}
                    <G>
                      <Rect
                        x={CX + DECK_W / 2 + 10}
                        y={curY - 13}
                        width={78}
                        height={24}
                        rx={6}
                        fill={isSelected ? '#FFC928' : '#171E2B'}
                        stroke={glow}
                        strokeWidth={isSelected ? '1.8' : '1'}
                      />
                      <SvgText
                        x={CX + DECK_W / 2 + 20}
                        y={curY + 3}
                        fill={isSelected ? '#171717' : '#FFFFFF'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {floor.floorName}
                      </SvgText>
                      {/* Status indicator dot */}
                      <Circle
                        cx={CX + DECK_W / 2 + 75}
                        cy={curY - 1}
                        r={3.5}
                        fill={glow}
                      />
                    </G>

                    {/* EV Charging Icon Badge on Left if applicable */}
                    {Boolean(floor.evSlots) && (
                      <G>
                        <Circle
                          cx={CX - DECK_W * 0.5 - 35}
                          cy={curY}
                          r={9}
                          fill="#0284C7"
                        />
                        <SvgText
                          x={CX - DECK_W * 0.5 - 35}
                          y={curY + 3}
                          fill="#FFFFFF"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ⚡
                        </SvgText>
                      </G>
                    )}
                  </G>
                );
              })}
            </Svg>

            {/* Explode / Expand Mode Toggle Button */}
            <TouchableOpacity
              style={[styles.floatingActionBtn, isExploded && styles.floatingActionBtnActive]}
              onPress={() => setIsExploded(!isExploded)}
              activeOpacity={0.8}
            >
              <Maximize2 size={13} color={isExploded ? '#171717' : '#FFFFFF'} />
              <Text style={[styles.floatingActionText, isExploded && styles.floatingActionTextActive]}>
                {isExploded ? 'Collapse' : 'Expand'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'slots' ? (
          /* ============================================================
             2. ISOMETRIC FLOOR DECK PLAN (Individual Clickable Slots)
             ============================================================ */
          <View style={styles.svgContainer}>
            <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}>
              {/* Floor Base Slab */}
              <Polygon
                points={`
                  ${CX},${40}
                  ${CX + DECK_W * 0.72},${40 + DECK_D * 0.8}
                  ${CX},${40 + DECK_D * 1.6}
                  ${CX - DECK_W * 0.72},${40 + DECK_D * 0.8}
                `}
                fill="#1E2430"
                stroke="#FFC928"
                strokeWidth="2"
              />

              {/* Central Driveway */}
              <Polygon
                points={`
                  ${CX - 20},${65}
                  ${CX + 20},${65}
                  ${CX + 24},${40 + DECK_D * 1.4}
                  ${CX - 24},${40 + DECK_D * 1.4}
                `}
                fill="#2D3546"
              />
              {/* Direction Arrows */}
              <Path
                d={`M ${CX} ${90} L ${CX - 6} ${102} L ${CX + 6} ${102} Z`}
                fill="#FFC928"
              />
              <Path
                d={`M ${CX} ${140} L ${CX - 6} ${152} L ${CX + 6} ${152} Z`}
                fill="#FFC928"
              />
              <Path
                d={`M ${CX} ${190} L ${CX - 6} ${202} L ${CX + 6} ${202} Z`}
                fill="#FFC928"
              />

              {/* Left Row of Parking Bays */}
              {interactiveSlots.slice(0, 5).map((slot, idx) => {
                const y = 75 + idx * 28;
                const x = CX - 32 - idx * 14;
                const isPicked = selectedSlot === slot.id;

                return (
                  <G
                    key={slot.id}
                    onPress={() => slot.isAvailable && onSelectSlot && onSelectSlot(slot.id)}
                  >
                    <Polygon
                      points={`
                        ${x},${y}
                        ${x - 42},${y + 14}
                        ${x - 42},${y + 32}
                        ${x},${y + 18}
                      `}
                      fill={
                        isPicked
                          ? '#FFC928'
                          : slot.isAvailable
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)'
                      }
                      stroke={
                        isPicked
                          ? '#FFC928'
                          : slot.isAvailable
                          ? '#22C55E'
                          : '#EF4444'
                      }
                      strokeWidth={isPicked ? '2' : '1'}
                    />

                    {slot.isAvailable ? (
                      <SvgText
                        x={x - 21}
                        y={y + 24}
                        fill={isPicked ? '#171717' : '#22C55E'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {slot.slotNumber}
                      </SvgText>
                    ) : (
                      /* Low-Poly Car */
                      <Polygon
                        points={`
                          ${x - 6},${y + 14}
                          ${x - 30},${y + 22}
                          ${x - 26},${y + 28}
                          ${x - 2},${y + 20}
                        `}
                        fill="#94A3B8"
                      />
                    )}
                  </G>
                );
              })}

              {/* Right Row of Parking Bays */}
              {interactiveSlots.slice(5, 10).map((slot, idx) => {
                const y = 75 + idx * 28;
                const x = CX + 32 + idx * 14;
                const isPicked = selectedSlot === slot.id;

                return (
                  <G
                    key={slot.id}
                    onPress={() => slot.isAvailable && onSelectSlot && onSelectSlot(slot.id)}
                  >
                    <Polygon
                      points={`
                        ${x},${y}
                        ${x + 42},${y + 14}
                        ${x + 42},${y + 32}
                        ${x},${y + 18}
                      `}
                      fill={
                        isPicked
                          ? '#FFC928'
                          : slot.isAvailable
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)'
                      }
                      stroke={
                        isPicked
                          ? '#FFC928'
                          : slot.isAvailable
                          ? '#22C55E'
                          : '#EF4444'
                      }
                      strokeWidth={isPicked ? '2' : '1'}
                    />

                    {slot.isAvailable ? (
                      <SvgText
                        x={x + 21}
                        y={y + 24}
                        fill={isPicked ? '#171717' : '#22C55E'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {slot.slotNumber}
                      </SvgText>
                    ) : (
                      <Polygon
                        points={`
                          ${x + 6},${y + 14}
                          ${x + 30},${y + 22}
                          ${x + 26},${y + 28}
                          ${x + 2},${y + 20}
                        `}
                        fill="#64748B"
                      />
                    )}
                  </G>
                );
              })}

              {/* Center Deck Plaque */}
              <Rect
                x={CX - 75}
                y={240}
                width={150}
                height={26}
                rx={13}
                fill="#171717"
                stroke="#FFC928"
                strokeWidth="1.5"
              />
              <SvgText
                x={CX}
                y={257}
                fill="#FFC928"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                Level {selectedFloor?.floorName || '1'} Slots
              </SvgText>
            </Svg>
          </View>
        ) : (
          /* ============================================================
             3. FACILITY & LEVEL SPECIFICATIONS TAB
             ============================================================ */
          <View style={styles.specsContainer}>
            <View style={styles.specRow}>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Total Capacity</Text>
                <Text style={styles.specValue}>{totalSlots} Slots</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Available Now</Text>
                <Text style={[styles.specValue, { color: '#22C55E' }]}>{totalFree} Free</Text>
              </View>
            </View>

            <View style={styles.specRow}>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Selected Deck</Text>
                <Text style={[styles.specValue, { color: '#FFC928' }]}>
                  Level {selectedFloor?.floorName || 'N/A'}
                </Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Clearance Height</Text>
                <Text style={styles.specValue}>2.2 Meters</Text>
              </View>
            </View>

            <View style={styles.featurePillsWrap}>
              <View style={styles.featurePill}>
                <ShieldCheck size={14} color="#16A34A" />
                <Text style={styles.featurePillText}>24/7 CCTV & Security Guard</Text>
              </View>
              <View style={styles.featurePill}>
                <Zap size={14} color="#0284C7" />
                <Text style={styles.featurePillText}>60kW DC Fast EV Chargers</Text>
              </View>
              <View style={styles.featurePill}>
                <Accessibility size={14} color="#3B82F6" />
                <Text style={styles.featurePillText}>Elevator Access at Barrier</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Structured Level Selector Bar (Below 3D Viewport) */}
      <View style={styles.floorQuickStrip}>
        <Text style={styles.stripLabel}>SELECT LEVEL:</Text>
        <View style={styles.stripChipsRow}>
          {floorList.map((f) => {
            const isSelected = selectedFloor?._id === f._id;
            const isFull = f.availableSlots <= 0;
            return (
              <TouchableOpacity
                key={f._id}
                style={[
                  styles.floorChip,
                  isSelected && styles.floorChipSelected,
                  isFull && styles.floorChipFull,
                ]}
                onPress={() => !isFull && onSelectFloor(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.floorChipText, isSelected && styles.floorChipTextSelected]}>
                  {f.floorName}
                </Text>
                <View
                  style={[
                    styles.chipDot,
                    {
                      backgroundColor: isFull
                        ? '#EF4444'
                        : f.availableSlots > 10
                        ? '#22C55E'
                        : '#F59E0B',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Floor Live Status Capsule */}
      {selectedFloor && (
        <View style={styles.statusCapsule}>
          <View style={styles.capsuleLeft}>
            <View style={styles.capsuleBadge}>
              <Text style={styles.capsuleBadgeText}>{selectedFloor.floorName}</Text>
            </View>
            <View>
              <Text style={styles.capsuleTitle}>Floor {selectedFloor.floorName}</Text>
              <Text style={styles.capsuleSub}>
                {selectedFloor.availableSlots} of {selectedFloor.totalSlots} Slots Free
              </Text>
            </View>
          </View>

          <View style={styles.capsuleRight}>
            <View style={[
              styles.statePill,
              selectedFloor.availableSlots <= 0
                ? styles.statePillFull
                : styles.statePillFree
            ]}>
              <Text style={[
                styles.statePillText,
                selectedFloor.availableSlots <= 0
                  ? styles.stateTextFull
                  : styles.stateTextFree
              ]}>
                {selectedFloor.availableSlots <= 0 ? 'FULL' : 'AVAILABLE'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: '#0C1017',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.28)',
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 9,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFC928',
    letterSpacing: 0.8,
  },
  hubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabPillGroup: {
    flexDirection: 'row',
    backgroundColor: '#161E2C',
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: '#FFC928',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabPillTextActive: {
    color: '#171717',
  },
  viewport: {
    backgroundColor: '#070A0F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingActionBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  floatingActionBtnActive: {
    backgroundColor: '#FFC928',
    borderColor: '#FFC928',
  },
  floatingActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingActionTextActive: {
    color: '#171717',
  },
  specsContainer: {
    padding: 18,
    minHeight: 280,
    justifyContent: 'center',
  },
  specRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#121824',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featurePillsWrap: {
    gap: 8,
    marginTop: 6,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#121824',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  floorQuickStrip: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  stripChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  floorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161F2E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  floorChipSelected: {
    backgroundColor: '#FFC928',
    borderColor: '#FFC928',
  },
  floorChipFull: {
    opacity: 0.45,
  },
  floorChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  floorChipTextSelected: {
    color: '#171717',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusCapsule: {
    marginTop: 12,
    backgroundColor: '#131A26',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.25)',
  },
  capsuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capsuleBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171717',
  },
  capsuleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  capsuleSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  capsuleRight: {
    alignItems: 'flex-end',
  },
  statePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statePillFree: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22C55E',
  },
  statePillFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  statePillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stateTextFree: {
    color: '#22C55E',
  },
  stateTextFull: {
    color: '#EF4444',
  },
});
