import Place from '../models/Place.js';
import ParkingLocation from '../models/ParkingLocation.js';

// Haversine Distance Formula in Kilometers
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get all places, with dynamic nearest parking details.
 */
export const getPlaces = async (req, res) => {
  try {
    const { search, latitude, longitude } = req.query;
    
    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const places = await Place.find(query);
    const parkingLocations = await ParkingLocation.find({ status: 'Active' });

    // Map through places and compute the nearest parking dynamically
    const placesWithParking = places.map((place) => {
      let nearestParking = null;
      let minDistance = Infinity;

      parkingLocations.forEach((loc) => {
        const distance = getHaversineDistance(place.latitude, place.longitude, loc.latitude, loc.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearestParking = {
            _id: loc._id,
            parkingName: loc.parkingName,
            distance: Number(distance.toFixed(2)), // distance in km
            distanceMeters: Math.round(distance * 1000), // distance in meters
            availableSlots: loc.availableSlots,
            hourlyPrice: loc.hourlyPrice,
            rating: 4.5 // Mock/Default rating
          };
        }
      });

      // Calculate user distance if user coordinates are provided
      let userDistance = null;
      if (latitude && longitude) {
        userDistance = Number(
          getHaversineDistance(Number(latitude), Number(longitude), place.latitude, place.longitude).toFixed(2)
        );
      }

      return {
        ...place.toObject(),
        nearestParking,
        distance: userDistance // Distance from user
      };
    });

    // Sort by user distance if user coordinates provided
    if (latitude && longitude) {
      placesWithParking.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    res.status(200).json(placesWithParking);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving places', error: error.message });
  }
};

/**
 * Seed places if collection is empty
 */
export const seedPlaces = async () => {
  try {
    const count = await Place.countDocuments();
    if (count > 0) return;

    const defaultPlaces = [
      {
        name: 'Sharda University',
        category: 'Universities',
        latitude: 28.4727,
        longitude: 77.4827,
        rating: 4.6,
        description: 'Renowned academic campus with state-of-the-art facilities in Greater Noida.',
        imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&q=80'
      },
      {
        name: 'Kailash Hospital Greater Noida',
        category: 'Hospitals',
        latitude: 28.4795,
        longitude: 77.4925,
        rating: 4.4,
        description: 'Modern healthcare hospital providing round-the-clock intensive medical services.',
        imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=500&q=80'
      },
      {
        name: 'The Grand Venice Mall',
        category: 'Shopping Malls',
        latitude: 28.4522,
        longitude: 77.5097,
        rating: 4.2,
        description: 'Italian-themed shopping mall complete with gondola boat rides and food court.',
        imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&q=80'
      },
      {
        name: 'Knowledge Park II Metro Station',
        category: 'Metro Stations',
        latitude: 28.4682,
        longitude: 77.4905,
        rating: 4.5,
        description: 'Metro hub on Noida Metro Aqua line serving Knowledge Park educational zone.',
        imageUrl: 'https://images.unsplash.com/photo-1542397284385-60141a5819fd?w=500&q=80'
      },
      {
        name: 'Radisson Blu Hotel',
        category: 'Hotels',
        latitude: 28.4610,
        longitude: 77.5015,
        rating: 4.7,
        description: 'Luxury 5-star hotel featuring world-class dining, lodging and amenities.',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80'
      },
      {
        name: 'Buddh International Circuit',
        category: 'Tourist Attractions',
        latitude: 28.3496,
        longitude: 77.5367,
        rating: 4.8,
        description: "India's premier FIA Grade 1 motor racing circuit hosting international events.",
        imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80'
      }
    ];

    await Place.insertMany(defaultPlaces);
    console.log('🌱 Places database seeded successfully.');
  } catch (error) {
    console.error('❌ Error seeding places:', error);
  }
};
