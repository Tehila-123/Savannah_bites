import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Sparkles, Bike, ChevronRight, Star } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { MENU_ITEMS } from '../constants/menuData';

export default function LandingScreen({ navigation }) {
  const hero = MENU_ITEMS[0];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Flame size={24} color="#F59E0B" />
          </View>
          <Text style={styles.logoText}>
            <Text style={styles.logoAccent}>✦ </Text>
            Savanna Bites
            <Text style={styles.logoAccent}> ✦</Text>
          </Text>
          <Text style={styles.logoSub}>ARTISANAL AFRICAN GASTRONOMY</Text>
        </View>

        {/* Hero card */}
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.93}
          onPress={() => navigation.navigate('Detail', { item: hero })}
        >
          <Image source={{ uri: hero.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />

          <View style={styles.heroTopLeft}>
            <View style={styles.heroPill}>
              <Flame size={12} color="#D97706" />
              <Text style={styles.heroPillText}>{hero.tag}</Text>
            </View>
          </View>

          <View style={styles.heroTopRight}>
            <View style={styles.heroRating}>
              <Star size={12} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.heroRatingText}>
                {hero.rating} ({hero.reviews})
              </Text>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.heroBottomLeft}>
              <Text style={styles.heroCategory}>Signature Heritage</Text>
              <Text style={styles.heroName}>{hero.name}</Text>
            </View>
            <View style={styles.heroTime}>
              <Text style={styles.heroTimeText}>~{hero.prepTime}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tagline */}
        <View style={styles.tagRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>✦ Culinary Excellence ✦</Text>
          </View>
        </View>
        <Text style={styles.headline}>Taste. Discover. Enjoy.</Text>
        <Text style={styles.subheadline}>
          Experience the rich heritage of modern African feasts prepared with artisanal
          craft, delivered warm to your doorstep.
        </Text>

        {/* Feature cards */}
        <View style={styles.featureRow}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
              <Flame size={16} color="#D97706" />
            </View>
            <Text style={styles.featureTitle}>Open Fire</Text>
            <Text style={styles.featureSub}>Authentic prep</Text>
          </View>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#ECFDF5' }]}>
              <Sparkles size={16} color="#059669" />
            </View>
            <Text style={styles.featureTitle}>Freshly Sourced</Text>
            <Text style={styles.featureSub}>Daily markets</Text>
          </View>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FFF7ED' }]}>
              <Bike size={16} color="#C2410C" />
            </View>
            <Text style={styles.featureTitle}>Heated Delivery</Text>
            <Text style={styles.featureSub}>Thermal sealed</Text>
          </View>
        </View>

        {/* CTA buttons */}
        <View style={styles.ctaGroup}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.btnPrimaryText}>Create Account</Text>
            <ChevronRight size={16} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.btnSecondaryText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 36 },

  logoRow: { alignItems: 'center', marginBottom: 20 },
  logoIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.stone900,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.stone900,
    letterSpacing: 1,
  },
  logoAccent: { color: '#92400E' },
  logoSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.stone500,
    letterSpacing: 2,
    marginTop: 2,
  },

  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    height: 260,
  },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // gradient simulated via Image overlay in React Native
    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
  },
  heroTopLeft: { position: 'absolute', top: 12, left: 12 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroPillText: { fontSize: 11, fontWeight: '700', color: COLORS.stone900 },
  heroTopRight: { position: 'absolute', top: 12, right: 12 },
  heroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroRatingText: { fontSize: 11, fontWeight: '700', color: '#FBBF24' },
  heroBottom: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroBottomLeft: { flex: 1 },
  heroCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FCD34D',
    backgroundColor: 'rgba(120,53,15,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroTime: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  heroTimeText: { fontSize: 11, fontWeight: '600', color: COLORS.stone200 },

  tagRow: { alignItems: 'center', marginBottom: 10 },
  tagBadge: {
    backgroundColor: COLORS.amberLight,
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.stone900,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 12,
    color: COLORS.stone600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  featureRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.stone200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.stone900,
    textAlign: 'center',
  },
  featureSub: {
    fontSize: 10,
    color: COLORS.stone500,
    marginTop: 2,
    textAlign: 'center',
  },

  ctaGroup: { gap: 12 },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  btnSecondary: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.stone200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  btnSecondaryText: { color: COLORS.stone900, fontSize: 14, fontWeight: '800' },
});
