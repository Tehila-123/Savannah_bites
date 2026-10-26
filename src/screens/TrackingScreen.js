import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Package, Bike, MapPin, Clock } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const STEPS = [
  { icon: CheckCircle, label: 'Order Received', sub: 'Your order has been confirmed', done: true },
  { icon: Package, label: 'Packaging', sub: 'Chef is preparing your feast', done: true },
  { icon: Bike, label: 'Out for Delivery', sub: 'Rider is on the way', done: false },
];

export default function TrackingScreen({ route, navigation }) {
  const { order } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Bounce in the check icon
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
    }).start();
    // Pulse the active step
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [scaleAnim, pulseAnim]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Big check */}
        <View style={s.heroSection}>
          <Animated.View style={[s.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <CheckCircle size={52} color={COLORS.white} fill={COLORS.primary} />
          </Animated.View>
          <Text style={s.heroTitle}>Order Placed! 🎉</Text>
          <Text style={s.heroSub}>Your feast is being crafted with love by our chefs.</Text>
          <View style={s.orderIdBadge}>
            <Text style={s.orderIdText}>Order #{order.id}</Text>
          </View>
        </View>

        {/* ETA card */}
        <View style={s.etaCard}>
          <View style={s.etaLeft}>
            <Clock size={20} color={COLORS.primary} />
            <View>
              <Text style={s.etaTime}>~25 min</Text>
              <Text style={s.etaSub}>Estimated delivery</Text>
            </View>
          </View>
          <View style={s.etaRight}>
            <MapPin size={14} color={COLORS.stone500} />
            <Text style={s.etaAddress} numberOfLines={1}>14 Victoria Island, Lagos</Text>
          </View>
        </View>

        {/* Step tracker */}
        <View style={s.trackerCard}>
          <Text style={s.trackerTitle}>Live Tracking</Text>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            const isActive = i === 1; // "Packaging" is the active step

            return (
              <View key={i} style={s.stepRow}>
                {/* Line connector */}
                <View style={s.stepLeft}>
                  <Animated.View style={[
                    s.stepIconBox,
                    step.done && s.stepIconBoxDone,
                    isActive && { transform: [{ scale: pulseAnim }] },
                  ]}>
                    <Icon size={16} color={step.done ? COLORS.white : COLORS.stone400} />
                  </Animated.View>
                  {!isLast && <View style={[s.connector, step.done && s.connectorDone]} />}
                </View>

                <View style={s.stepBody}>
                  <Text style={[s.stepLabel, step.done && s.stepLabelDone]}>{step.label}</Text>
                  <Text style={s.stepSub}>{step.sub}</Text>
                  {isActive && (
                    <View style={s.activeBadge}>
                      <Text style={s.activeBadgeText}>In Progress</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order total summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Order Details</Text>
          {order.items.map((item, i) => (
            <View key={i} style={s.summaryItem}>
              <Text style={s.summaryQty}>{item.quantity}×</Text>
              <Text style={s.summaryName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.summaryPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryName, { fontWeight: '900', color: COLORS.stone900 }]}>Total Paid</Text>
            <Text style={[s.summaryPrice, { color: COLORS.primary, fontSize: 16, fontWeight: '900' }]}>${order.total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.85}
        >
          <Text style={s.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  heroSection: { alignItems: 'center', paddingVertical: 20 },
  checkCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(27,59,43,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: COLORS.stone900, marginBottom: 8 },
  heroSub: { fontSize: 13, color: COLORS.stone500, textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  orderIdBadge: { backgroundColor: COLORS.stone100, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  orderIdText: { fontSize: 12, fontWeight: '700', color: COLORS.stone700, letterSpacing: 0.5 },
  etaCard: { backgroundColor: COLORS.primary, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  etaTime: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  etaSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  etaRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' },
  etaAddress: { fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1, textAlign: 'right' },
  trackerCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.stone100, elevation: 1 },
  trackerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.stone900, marginBottom: 18 },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepLeft: { alignItems: 'center' },
  stepIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.stone200, alignItems: 'center', justifyContent: 'center' },
  stepIconBoxDone: { backgroundColor: COLORS.primary },
  connector: { width: 2, flex: 1, backgroundColor: COLORS.stone200, marginVertical: 4, minHeight: 28 },
  connectorDone: { backgroundColor: COLORS.primary },
  stepBody: { flex: 1, paddingBottom: 20 },
  stepLabel: { fontSize: 14, fontWeight: '700', color: COLORS.stone500, marginBottom: 3 },
  stepLabelDone: { color: COLORS.stone900 },
  stepSub: { fontSize: 12, color: COLORS.stone500, lineHeight: 16 },
  activeBadge: { marginTop: 6, backgroundColor: COLORS.amberLight, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.stone100, elevation: 1 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: COLORS.stone900, marginBottom: 12 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryQty: { fontSize: 12, fontWeight: '800', color: COLORS.stone500, width: 22 },
  summaryName: { flex: 1, fontSize: 13, color: COLORS.stone700 },
  summaryPrice: { fontSize: 13, fontWeight: '700', color: COLORS.stone900 },
  divider: { height: 1, backgroundColor: COLORS.stone200, marginVertical: 10 },
  homeBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 4 },
  homeBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});
