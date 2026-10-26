import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, CreditCard, Smartphone, Banknote, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, sub: 'Visa, Mastercard, Verve' },
  { id: 'apple', label: 'Apple Pay', icon: Smartphone, sub: 'Touch ID or Face ID' },
  { id: 'pod', label: 'Pay on Delivery', icon: Banknote, sub: 'Cash or POS at door' },
];

export default function CheckoutScreen({ route, navigation }) {
  const { total } = route.params;
  const { cart, user, setOrderPlaced, clearCart } = useCart();
  const [payMethod, setPayMethod] = useState('card');
  const [notes, setNotes] = useState('');

  function placeOrder() {
    const order = {
      id: `SB-${Date.now()}`,
      items: cart,
      total,
      payMethod,
      notes,
      address: '14 Victoria Island, Lagos',
      createdAt: new Date().toISOString(),
    };
    setOrderPlaced(order);
    clearCart();
    navigation.navigate('Tracking', { order });
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={COLORS.stone800} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Checkout</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Delivery address */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <MapPin size={16} color={COLORS.primary} />
              <Text style={s.sectionTitle}>Delivery Address</Text>
            </View>
            <View style={s.addressCard}>
              <View style={s.addressLeft}>
                <Text style={s.addressName}>{user.name}</Text>
                <Text style={s.addressLine}>14 Victoria Island, Lagos</Text>
                <Text style={s.addressLine}>{user.phone}</Text>
              </View>
              <View style={s.addressBadge}><Text style={s.addressBadgeText}>Home</Text></View>
            </View>
          </View>

          {/* Order summary */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Order Summary ({cart.length} item{cart.length !== 1 ? 's' : ''})</Text>
            {cart.map((item, i) => (
              <View key={i} style={s.summaryItem}>
                <Text style={s.summaryQty}>{item.quantity}×</Text>
                <Text style={s.summaryName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.summaryPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Payment */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <CreditCard size={16} color={COLORS.primary} />
              <Text style={s.sectionTitle}>Payment Method</Text>
            </View>
            <View style={s.payList}>
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                const active = payMethod === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.payCard, active && s.payCardActive]}
                    onPress={() => setPayMethod(m.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[s.payIconBox, active && s.payIconBoxActive]}>
                      <Icon size={18} color={active ? COLORS.white : COLORS.stone600} />
                    </View>
                    <View style={s.payInfo}>
                      <Text style={[s.payLabel, active && s.payLabelActive]}>{m.label}</Text>
                      <Text style={s.paySub}>{m.sub}</Text>
                    </View>
                    <View style={[s.radioOuter, active && s.radioOuterActive]}>
                      {active && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chef notes */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Chef Notes (optional)</Text>
            <TextInput
              style={s.notesInput}
              placeholder="e.g. Extra pepper, no onions, make it mild..."
              placeholderTextColor={COLORS.stone400}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Security note */}
          <View style={s.secureRow}>
            <ShieldCheck size={14} color={COLORS.emerald600} />
            <Text style={s.secureText}>Your payment is protected with 256-bit SSL encryption</Text>
          </View>
        </ScrollView>

        {/* Place order bar */}
        <View style={s.bottomBar}>
          <View>
            <Text style={s.barLabel}>Total</Text>
            <Text style={s.barTotal}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={s.placeBtn} onPress={placeOrder} activeOpacity={0.85}>
            <Text style={s.placeBtnText}>Place Order</Text>
            <ChevronRight size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.stone100 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.stone100, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.stone900 },
  scroll: { padding: 16, paddingBottom: 100, gap: 20 },
  section: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.stone100, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.stone900, marginBottom: 12 },
  addressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.stone50, borderRadius: 12, padding: 12 },
  addressLeft: { flex: 1 },
  addressName: { fontSize: 14, fontWeight: '700', color: COLORS.stone900, marginBottom: 3 },
  addressLine: { fontSize: 12, color: COLORS.stone600, marginBottom: 1 },
  addressBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  addressBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryQty: { fontSize: 12, fontWeight: '800', color: COLORS.stone500, width: 22 },
  summaryName: { flex: 1, fontSize: 13, color: COLORS.stone700 },
  summaryPrice: { fontSize: 13, fontWeight: '700', color: COLORS.stone900 },
  payList: { gap: 10 },
  payCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.stone50, borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: COLORS.stone200 },
  payCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(27,59,43,0.04)' },
  payIconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: COLORS.stone200, alignItems: 'center', justifyContent: 'center' },
  payIconBoxActive: { backgroundColor: COLORS.primary },
  payInfo: { flex: 1 },
  payLabel: { fontSize: 13, fontWeight: '700', color: COLORS.stone800, marginBottom: 2 },
  payLabelActive: { color: COLORS.primary },
  paySub: { fontSize: 11, color: COLORS.stone500 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.stone300, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: COLORS.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  notesInput: { backgroundColor: COLORS.stone50, borderRadius: 12, borderWidth: 1, borderColor: COLORS.stone200, padding: 12, fontSize: 13, color: COLORS.stone900, minHeight: 80, textAlignVertical: 'top' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 4 },
  secureText: { fontSize: 11, color: COLORS.stone500 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.stone200, paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, elevation: 10 },
  barLabel: { fontSize: 11, color: COLORS.stone500, marginBottom: 2 },
  barTotal: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  placeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, elevation: 4 },
  placeBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});
