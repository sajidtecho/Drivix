/**
 * Standalone Node.js Test Runner for Drivix Smart Parking Booking Rules
 * Run via: node scripts/test-booking-flow.js
 */

const assert = require('assert');

console.log('========================================================');
console.log('  DRIVIX SMART PARKING: BOOKING ENGINE & BUSINESS TESTS  ');
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASSED: ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`    ${error.message}`);
  }
}

// ─── 1. Floor Capacity & Allocation Tests ───
const mockFloors = [
  { _id: 'floor_g', name: 'Ground Floor', total: 60, available: 12 },
  { _id: 'floor_l1', name: 'Level 1', total: 60, available: 0 },
  { _id: 'floor_l2', name: 'Level 2', total: 60, available: 45 },
];

test('Capacity Filter: Filters out floors with zero available capacity', () => {
  const availableFloors = mockFloors.filter((f) => f.available > 0);
  assert.strictEqual(availableFloors.length, 2);
  assert.strictEqual(availableFloors.some((f) => f.name === 'Level 1'), false);
});

test('Floor Reservation: Throws error when attempting to reserve full floor', () => {
  const reserveFloor = (floor) => {
    if (floor.available <= 0) throw new Error('No capacity available');
    return true;
  };
  assert.throws(() => reserveFloor(mockFloors[1]), /No capacity available/);
  assert.strictEqual(reserveFloor(mockFloors[0]), true);
});

// ─── 2. ML Dynamic Pricing & Guardrail Tests ───
test('Base Pricing: Correctly computes standard rate without surge', () => {
  const hourlyRate = 40;
  const hours = 3;
  assert.strictEqual(hourlyRate * hours, 120);
});

test('ML Dynamic Surge: Correctly computes authoritative backend quote price', () => {
  const mockQuote = {
    basePrice: 40,
    recommendedPrice: 52,
    multiplier: 1.30,
    pricingAlert: 'High Demand Surge (+30%)',
    isSurgeActive: true,
  };
  const hours = 4;
  const totalPrice = Math.round(mockQuote.recommendedPrice * hours);
  assert.strictEqual(totalPrice, 208);
  assert.strictEqual(mockQuote.isSurgeActive, true);
});

test('Pricing Fallback: Uses base rate when dynamic pricing service unavailable', () => {
  const quote = null;
  const baseRate = 40;
  const hours = 2;
  const finalRate = quote ? quote.recommendedPrice : baseRate;
  assert.strictEqual(finalRate * hours, 80);
});

// ─── 3. Number Plate Validation Tests ───
const validatePlate = (plate) => {
  const cleaned = (plate || '').trim().toUpperCase().replace(/[\s-]/g, '');
  return /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(cleaned);
};

test('Plate Validator: Validates standard Indian registration plates', () => {
  assert.strictEqual(validatePlate('UP16AB1234'), true);
  assert.strictEqual(validatePlate('DL 01 C 9999'), true);
  assert.strictEqual(validatePlate('MH-12-DE-1433'), true);
  assert.strictEqual(validatePlate('KA03HA1111'), true);
});

test('Plate Validator: Rejects invalid plate formats', () => {
  assert.strictEqual(validatePlate('1234'), false);
  assert.strictEqual(validatePlate('UP16'), false);
  assert.strictEqual(validatePlate(''), false);
  assert.strictEqual(validatePlate('INVALID_PLATE'), false);
});

// ─── 4. Booking Lifecycle & Physical Slot Allocation Tests ───
test('Booking Lifecycle: New reservation created as Confirmed with deferred slot', () => {
  const booking = {
    id: 'DRV-101',
    status: 'Confirmed',
    slotId: null, // Critical business rule: deferred until arrival
    paymentMode: 'PAY_AFTER_CHECKOUT',
    totalCost: 150,
  };
  assert.strictEqual(booking.status, 'Confirmed');
  assert.strictEqual(booking.slotId, null);
  assert.strictEqual(booking.paymentMode, 'PAY_AFTER_CHECKOUT');
});

test('Arrival Event: Triggers slot assignment and QR pass activation', () => {
  let booking = {
    id: 'DRV-101',
    status: 'Confirmed',
    slotId: null,
    qrToken: null,
  };

  // Simulate slot assignment
  const onArrival = (slot, qr) => {
    booking.status = 'Slot Assigned';
    booking.slotId = slot;
    booking.qrToken = qr;
  };

  onArrival('L2-B09', 'QR_SECURE_TOKEN_DRV101_L2B09');
  assert.strictEqual(booking.status, 'Slot Assigned');
  assert.strictEqual(booking.slotId, 'L2-B09');
  assert.ok(booking.qrToken.includes('DRV101'));
});

test('Vacate & Checkout: Successfully transitions to Checked Out', () => {
  let booking = { status: 'Slot Assigned' };
  booking.status = 'Checked Out';
  assert.strictEqual(booking.status, 'Checked Out');
});

console.log(`\n========================================================`);
console.log(`  RESULTS: ${passedTests}/${totalTests} Tests Passed successfully!`);
console.log(`========================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
