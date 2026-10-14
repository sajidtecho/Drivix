import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CarWashCenter from '../models/CarWashCenter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedCarWashCenters = async () => {
  try {
    const count = await CarWashCenter.countDocuments();
    if (count > 0) {
      console.log(`[Seed] CarWashCenters already populated (${count} records). Skipping.`);
      return;
    }

    const jsonPath = path.resolve(__dirname, '../../../car_spa_centres_ncr.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn('[Seed] car_spa_centres_ncr.json not found at', jsonPath);
      return;
    }

    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const centersToInsert = rawData.map((item) => {
      const lowerName = item.name.toLowerCase();
      const services = item.services || ['car wash'];

      // Assign vehicle support
      const supportedVehicles = ['car'];
      if (!lowerName.includes('truck')) {
        supportedVehicles.push('bike');
      }
      if (lowerName.includes('auto') || lowerName.includes('heavy') || item.city === 'Greater Noida') {
        supportedVehicles.push('bus_truck');
      }

      return {
        name: item.name,
        city: item.city || 'Noida',
        locality: item.locality || item.city || 'Noida',
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        phone: item.phone || '+91 98100 12345',
        website: item.website || null,
        supportedVehicles,
        services,
        pricing: {
          bike: 149,
          car: item.startingPrice || 299,
          bus_truck: 799,
        },
        rating: item.rating || 4.8,
        reviewsCount: Math.floor(Math.random() * 80) + 40,
        operatingHours: '08:00 AM - 08:30 PM',
        external_id: item.external_id,
        isActive: true,
      };
    });

    await CarWashCenter.insertMany(centersToInsert);
    console.log(`[Seed] Successfully seeded ${centersToInsert.length} CarWashCenters.`);
  } catch (err) {
    console.error('[Seed] Error seeding CarWashCenters:', err);
  }
};
