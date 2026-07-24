import Banner from '../models/Banner.js';

const defaultBanners = [
  {
    title: '🔋 HyperEV Fast Charging Offers',
    description: 'Get up to 30% off on DC Fast Charging at selected EV stations. Keep your vehicle charged and ready!',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=60',
    ctaText: 'Find EV Stations',
    redirectUrl: '/services',
    priority: 1,
    isActive: true
  },
  {
    title: '🛡️ Premium Auto Insurance Renewal',
    description: 'Compare best insurance deals for your car or bike starting at just ₹2/day. Zero depreciation covers included.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
    ctaText: 'Renew Policy',
    redirectUrl: '/services',
    priority: 2,
    isActive: true
  },
  {
    title: '🧽 Sparkle Car Spa & Detailing',
    description: 'Pamper your car with premium ceramic coating and deep foam wash. Flat 25% discount for premium members.',
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?w=800&auto=format&fit=crop&q=60',
    ctaText: 'Book detailing',
    redirectUrl: '/services',
    priority: 3,
    isActive: true
  },
  {
    title: '🏷️ Monthly Premium Parking Pass',
    description: 'Save big with monthly unlimited parking passes. Hassle-free automatic ANPR gate entry at all locations.',
    imageUrl: 'https://images.unsplash.com/photo-1506521788723-868151859b90?w=800&auto=format&fit=crop&q=60',
    ctaText: 'Buy Pass',
    redirectUrl: '/profile?tab=wallet',
    priority: 4,
    isActive: true
  },
  {
    title: '🚨 Roadside Towing & Assistance',
    description: 'Flat tyre or battery breakdown? Instant roadside towing assistance available 24/7 across the city.',
    imageUrl: 'https://images.unsplash.com/photo-1562613508-228186b4931f?w=800&auto=format&fit=crop&q=60',
    ctaText: 'Get Help Now',
    redirectUrl: '/services',
    priority: 5,
    isActive: true
  }
];

export const seedBanners = async () => {
  try {
    const count = await Banner.countDocuments({});
    if (count === 0) {
      console.log('🌱 Seeding default automotive advertisement banners...');
      await Banner.create(defaultBanners);
      console.log('✅ Successfully seeded banners!');
    }
  } catch (error) {
    console.error('❌ Failed to seed banners:', error.message);
  }
};
