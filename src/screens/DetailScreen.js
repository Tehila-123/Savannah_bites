import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Clock, Flame, Plus, Minus, ShoppingCart, Heart } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';

const SPICE_LEVELS = ['Mild', 'Medium', 'Extra Fire'];

export default function DetailScreen({ route, navigation }) {
  const { item } = route.params;
  const { addToCart, toast } = useCart();
  const [spice, setSpice] = useState(SPICE_LEVELS[Math.min(item.spicyLevel, 2)]);
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);

  const spiceIcons = { Mild: '🌿', Medium: '🌶️', 'Extra Fire': '🔥' };

  function handleAdd() {
    addToCart(item, qty, { spice });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Toast message={toast} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero image */}
        <View style={s.heroWrap}>
          <Image source={{ uri: item.image }} style={s.heroImg} />
          <View style={s.heroOverlay} />

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={s.likeBtn} onPress={() => setLiked(!liked)}>
            <Heart size={18} color={liked ? '#EF4444' : COLORS.white} fill={liked ? '#EF4444' : 'transparent'} />
          </TouchableOpacity>

          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>{item.tag}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Name + rating */}
          <View style={s.titleRow}>
            <Text style={s.name} numberOfLines={2}>{item.name}</Text>
            <View style={s.ratingBox}>
              <Star size={13} color="#FBBF24" fill="#FBBF24" />
              <Text style={s.ratingText}>{item.rating}</Text>
            </View>
          </View>
          <Text style={s.reviews}>{item.reviews} reviews</Text>

          {/* Meta chips */}
          <View style={s.metaRow}>
            <View style={s.metaChip}>
              <Clock size={13} color={COLORS.stone500} />
              <Text style={s.metaChipText}>{item.prepTime}</Text>
            </View>
            <View style={s.metaChip}>
              <Text style={s.metaChipText}>🔥 {item.calories}</Text>
            </View>
            <View style={s.metaChip}>
              <Flame size={13} color={item.spicyLevel >= 2 ? '#DC2626' : COLORS.stone400} />
              <Text style={s.metaChipText}>
                {item.spicyLevel === 0 ? 'No spice' : item.spicyLevel === 1 ? 'Mild' : item.spicyLevel === 2 ? 'Medium' : 'Extra Hot'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={s.sectionLabel}>About this dish</Text>
          <Text style={s.desc}>{item.description}</Text>

          {/* Spice selector */}
          <Text style={s.sectionLabel}>Choose your spice level</Text>
          <View style={s.spiceRow}>
            {SPICE_LEVELS.map(lvl => (
              <TouchableOpacity
                key={lvl}
                style={[s.spiceBtn, spice === lvl && s.spiceBtnActive]}
                onPress={() => setSpice(lvl)}
                activeOpacity={0.8}
              >
                <Text style={s.spiceIcon}>{spiceIcons[lvl]}</Text>
                <Text style={[s.spiceLabel, spice === lvl && s.spiceLabelActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity selector */}
          <View style={s.qtyRow}>
            <Text style={s.sectionLabel}>Quantity</Text>
            <View style={s.qtyControl}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
                <Minus size={14} color={COLORS.stone700} />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{qty}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(qty + 1)}>
                <Plus size={14} color={COLORS.stone700} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        <View>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalPrice}>${(item.price * qty).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.85}>
          <ShoppingCart size={18} color={COLORS.white} />
          <Text style={s.addBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  heroWrap: { height: 280, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  likeBtn: { position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroBadge: { position: 'absolute', bottom: 14, left: 14, backgroundColor: 'rgba(120,53,15,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#FCD34D', letterSpacing: 0.5 },
  body: { padding: 18, paddingBottom: 100 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  name: { flex: 1, fontSize: 22, fontWeight: '900', color: COLORS.stone900, marginRight: 12, lineHeight: 28 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.amberLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  reviews: { fontSize: 12, color: COLORS.stone500, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.stone100, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  metaChipText: { fontSize: 12, color: COLORS.stone700, fontWeight: '600' },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: COLORS.stone900, marginBottom: 8, marginTop: 4 },
  desc: { fontSize: 13, color: COLORS.stone600, lineHeight: 20, marginBottom: 20 },
  spiceRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  spiceBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.stone200 },
  spiceBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(27,59,43,0.06)' },
  spiceIcon: { fontSize: 20, marginBottom: 4 },
  spiceLabel: { fontSize: 11, fontWeight: '700', color: COLORS.stone600 },
  spiceLabelActive: { color: COLORS.primary },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 0, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.stone200, borderRadius: 14, overflow: 'hidden' },
  qtyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.stone100 },
  qtyNum: { width: 40, textAlign: 'center', fontSize: 16, fontWeight: '800', color: COLORS.stone900 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.stone200, paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, elevation: 10 },
  totalLabel: { fontSize: 11, color: COLORS.stone500, marginBottom: 2 },
  totalPrice: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, elevation: 4 },
  addBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});
