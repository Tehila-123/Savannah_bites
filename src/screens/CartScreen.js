import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Plus, Minus, Trash2, ChevronRight, Package } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';

const DELIVERY_FEE = 3.50;
const PACKAGING_FEE = 1.50;

export default function CartScreen({ navigation }) {
  const { cart, updateQuantity, cartTotal, toast } = useCart();

  const fees = DELIVERY_FEE + PACKAGING_FEE;
  const grandTotal = cartTotal + fees;

  if (cart.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}><Text style={s.headerTitle}>Your Cart</Text></View>
        <View style={s.empty}>
          <View style={s.emptyIcon}><ShoppingBag size={36} color={COLORS.stone400} /></View>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Add some delicious West African dishes to get started</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('HomeTab')}>
            <Text style={s.emptyBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function renderItem({ item, index }) {
    return (
      <View style={s.cartItem}>
        <Image source={{ uri: item.image }} style={s.itemImg} />
        <View style={s.itemBody}>
          <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={s.spiceTag}>
            <Text style={s.spiceTagText}>
              {item.spice === 'Extra Fire' ? '🔥' : item.spice === 'Medium' ? '🌶️' : '🌿'} {item.spice}
            </Text>
          </View>
          <View style={s.itemFooter}>
            <Text style={s.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            <View style={s.qtyControl}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(index, -1)}>
                {item.quantity === 1
                  ? <Trash2 size={12} color="#EF4444" />
                  : <Minus size={12} color={COLORS.stone700} />
                }
              </TouchableOpacity>
              <Text style={s.qtyNum}>{item.quantity}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(index, 1)}>
                <Plus size={12} color={COLORS.stone700} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <Toast message={toast} />
      <View style={s.header}>
        <Text style={s.headerTitle}>Your Cart</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{cart.reduce((n, i) => n + i.quantity, 0)} items</Text>
        </View>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item, i) => `${item.id}-${item.spice}-${i}`}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={s.summary}>
            <Text style={s.summaryTitle}>Order Summary</Text>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryVal}>${cartTotal.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <View style={s.summaryLabelRow}>
                <Package size={13} color={COLORS.stone500} />
                <Text style={s.summaryLabel}>Delivery fee</Text>
              </View>
              <Text style={s.summaryVal}>${DELIVERY_FEE.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Packaging</Text>
              <Text style={s.summaryVal}>${PACKAGING_FEE.toFixed(2)}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.summaryRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalVal}>${grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        }
      />

      <View style={s.bottomBar}>
        <View>
          <Text style={s.checkoutLabel}>Grand Total</Text>
          <Text style={s.checkoutPrice}>${grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={s.checkoutBtn}
          activeOpacity={0.85}
          onPress={() => navigation.getParent()?.navigate('Checkout', { total: grandTotal })}
        >
          <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
          <ChevronRight size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.stone100 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.stone900 },
  headerBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.stone100, elevation: 1 },
  itemImg: { width: 88, height: 88, resizeMode: 'cover' },
  itemBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  itemName: { fontSize: 13, fontWeight: '800', color: COLORS.stone900 },
  spiceTag: { backgroundColor: COLORS.amberLight, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 3 },
  spiceTagText: { fontSize: 10, fontWeight: '600', color: '#92400E' },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: '900', color: COLORS.primary },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.stone100, borderRadius: 10, overflow: 'hidden' },
  qtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { width: 28, textAlign: 'center', fontSize: 13, fontWeight: '800', color: COLORS.stone900 },
  summary: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.stone100, marginTop: 4 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: COLORS.stone900, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  summaryLabel: { fontSize: 13, color: COLORS.stone600 },
  summaryVal: { fontSize: 13, fontWeight: '700', color: COLORS.stone700 },
  divider: { height: 1, backgroundColor: COLORS.stone200, marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '900', color: COLORS.stone900 },
  totalVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.stone200, paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, elevation: 10 },
  checkoutLabel: { fontSize: 11, color: COLORS.stone500, marginBottom: 2 },
  checkoutPrice: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, elevation: 4 },
  checkoutBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.stone100, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.stone800, marginBottom: 8 },
  emptySub: { fontSize: 13, color: COLORS.stone500, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
