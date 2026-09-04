import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, useWindowDimensions, Image as RNImage } from 'react-native';

export interface CarDeal {
  id: string;
  title: string;
  type: string;
  price: string;
  variants: string;
  rating: string;
  reviews: string;
  image: any;
  badge?: string;
}

export const CAR_DEALS: CarDeal[] = [
  {
    id: 'altroz',
    title: 'Tata Altroz',
    type: 'Hatchback',
    price: '₹6.30 - ₹10.77 Lakhs',
    variants: '27+ Variants',
    rating: '4.6',
    reviews: '346',
    image: require('../../../assets/images/altroz.png'),
    badge: 'Popular',
  },
  {
    id: 'xuv700',
    title: 'Mahindra XUV700',
    type: 'SUV',
    price: '₹13.99 - ₹26.99 Lakhs',
    variants: '30+ Variants',
    rating: '4.8',
    reviews: '512',
    image: require('../../../assets/images/xuv700.png'),
    badge: 'Top Rated',
  },
  {
    id: 'creta',
    title: 'Hyundai Creta',
    type: 'Crossover SUV',
    price: '₹10.99 - ₹20.15 Lakhs',
    variants: '24+ Variants',
    rating: '4.7',
    reviews: '428',
    image: require('../../../assets/images/creta.png'),
    badge: 'Best Seller',
  },
];

export const CarDealsCarousel: React.FC = () => {
  const { width } = useWindowDimensions();
  const [activeCarTab, setActiveCarTab] = useState<'popular' | 'testdrive'>('popular');

  return (
    <View style={styles.dreamCarSection}>
      <View style={styles.dreamCarHeaderAccents}>
        <Text style={styles.dreamCarSparkle}>✦</Text>
        <Text style={styles.dreamCarSubtitle}>BUY YOUR DREAM CAR</Text>
        <Text style={styles.dreamCarSparkle}>✦</Text>
      </View>

      <Text style={styles.dreamCarTitle}>
        Drive home with <Text style={styles.dreamCarBrand}>Drivix</Text>
      </Text>

      <View style={styles.dreamCarTabsRow}>
        <TouchableOpacity
          style={styles.dreamCarTabItem}
          onPress={() => setActiveCarTab('popular')}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.dreamCarTabText,
            { color: activeCarTab === 'popular' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)' }
          ]}>
            Popular Cars
          </Text>
          {activeCarTab === 'popular' && <View style={styles.dreamCarActiveIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dreamCarTabItem}
          onPress={() => setActiveCarTab('testdrive')}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.dreamCarTabText,
            { color: activeCarTab === 'testdrive' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)' }
          ]}>
            Test Drive
          </Text>
          {activeCarTab === 'testdrive' && <View style={styles.dreamCarActiveIndicator} />}
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={CAR_DEALS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={width - 54}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.carCardContainer, { width: width - 72 }]}>
            <View style={styles.carImageContainer}>
              <RNImage source={item.image} style={styles.carCardImage} resizeMode="contain" />
              <View style={styles.carRatingBadge}>
                <Text style={styles.carRatingStar}>★</Text>
                <Text style={styles.carRatingText}>{item.rating} ({item.reviews} reviews)</Text>
              </View>
            </View>

            <View style={styles.carInfoContainer}>
              <Text style={styles.carModelTitle}>{item.title}</Text>
              <Text style={styles.carModelSpecs}>
                {item.type} • {item.price} • {item.variants}
              </Text>

              <TouchableOpacity
                style={styles.bookTestDriveBtn}
                onPress={() => Alert.alert('Book Test Drive', `Test drive request submitted for ${item.title}. Our Drivix concierge will contact you shortly!`)}
                activeOpacity={0.85}
              >
                <Text style={styles.bookTestDriveBtnText}>Book Test Drive</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.viewMoreCarsLink}
        onPress={() => Alert.alert('Explore Models', 'Opening Drivix Car Marketplace with 200+ certified models...')}
        activeOpacity={0.7}
      >
        <Text style={styles.viewMoreCarsLinkText}>View 200+ Models</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dreamCarSection: {
    marginVertical: 16,
    paddingVertical: 20,
    backgroundColor: '#0c1017',
    borderRadius: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dreamCarHeaderAccents: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dreamCarSparkle: {
    color: '#ffce00',
    fontSize: 10,
  },
  dreamCarSubtitle: {
    color: '#ffce00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dreamCarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  dreamCarBrand: {
    color: '#ffce00',
  },
  dreamCarTabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  dreamCarTabItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dreamCarTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dreamCarActiveIndicator: {
    height: 3,
    width: 24,
    backgroundColor: '#ffce00',
    borderRadius: 2,
    marginTop: 6,
  },
  carCardContainer: {
    marginRight: 14,
    backgroundColor: 'rgba(20, 26, 38, 0.9)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  carImageContainer: {
    height: 140,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  carCardImage: {
    width: '90%',
    height: '90%',
  },
  carRatingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  carRatingStar: {
    color: '#ffce00',
    fontSize: 10,
  },
  carRatingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  carInfoContainer: {
    marginTop: 12,
  },
  carModelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  carModelSpecs: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    marginBottom: 12,
  },
  bookTestDriveBtn: {
    backgroundColor: '#ffce00',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  bookTestDriveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  viewMoreCarsLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
  viewMoreCarsLinkText: {
    color: '#ffce00',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default CarDealsCarousel;
