import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Clock, Plus, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { MENU_ITEMS, CATEGORIES } from '../constants/menuData';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';

export default function ExploreScreen({ navigation }) {
  const { addToCart, toast } = useCart();
  const [activeCategory, setActiveCategory] = useState('Jollof & Rice');

  const cats = CATEGORIES.filter(c => c !== 'All');
  const items = MENU_ITEMS.filter(i => i.category === activeCategory);

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.getParent()?.navigate('Detail', { item })}
        activeOpacity={0.88}
      >
        <Image source={{ uri: item.image }} style={s.cardImg} />
        <View style={s.cardOverlay} />
        <View style={s.cardTag}><Text style={s.cardTagText}>{item.tag}</Text></View>
        <View style={s.cardBody}>
          <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={s.cardFooter}>
            <View style={s.metaRow}>
              <Star size={12} color="#FBBF24" fill="#FBBF24" />
              <Text style={s.metaText}>{item.rating}</Text>
              <Text style={s.dot}>·</Text>
              <Clock size={12} color="rgba(255,255,255,0.7)" />
              <Text style={s.metaText}>{item.prepTime}</Text>
            </View>
            <View style={s.priceRow}>
              <Text style={s.price}>${item.price.toFixed(2)}</Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => addToCart(item, 1, { spice: 'Medium' })}
                activeOpacity={0.8}
              >
                <Plus size={14} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <Toast message={toast} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Explore</Text>
        <Text style={s.headerSub}>Browse by category</Text>
      </View>

      {/* Horizontal category tabs */}
      <View>
        <FlatList
          horizontal
          data={cats}
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabs}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[s.tab, activeCategory === cat && s.tabActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, activeCategory === cat && s.tabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Featured category header */}
      <View style={s.catHeader}>
        <View>
          <Text style={s.catTitle}>{activeCategory}</Text>
          <Text style={s.catCount}>{items.length} dishes available</Text>
        </View>
        <TouchableOpacity style={s.viewAll}>
          <Text style={s.viewAllText}>View all</Text>
          <ChevronRight size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.stone900 },
  headerSub: { fontSize: 12, color: COLORS.stone500, marginTop: 2 },
  tabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.stone200 },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.stone600 },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  catTitle: { fontSize: 16, fontWeight: '800', color: COLORS.stone900, marginBottom: 2 },
  catCount: { fontSize: 12, color: COLORS.stone500 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: { width: '48%', borderRadius: 16, overflow: 'hidden', height: 210 },
  cardImg: { width: '100%', height: '100%', position: 'absolute' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  cardTag: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  cardTagText: { fontSize: 9, fontWeight: '700', color: '#FCD34D' },
  cardBody: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  cardName: { fontSize: 12, fontWeight: '800', color: COLORS.white, marginBottom: 3 },
  cardDesc: { fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 14, marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  dot: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 13, fontWeight: '900', color: COLORS.white },
  addBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
});
