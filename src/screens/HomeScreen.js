import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Image, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Star, Clock, Plus, Flame } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { MENU_ITEMS, CATEGORIES } from '../constants/menuData';
import { useCart } from '../context/CartContext';
import Toast from '../components/Toast';

export default function HomeScreen({ navigation }) {
  const { user, addToCart, cartCount, toast } = useCart();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return MENU_ITEMS.filter(item => {
      const matchCat = category === 'All' || item.category === category;
      const matchQ = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  const firstName = user.name.split(' ')[0];

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.88}
        onPress={() => navigation.getParent()?.navigate('Detail', { item })}
      >
        <Image source={{ uri: item.image }} style={s.cardImg} />
        <View style={s.cardBody}>
          <View style={s.cardTagRow}>
            <View style={s.tagPill}>
              <Text style={s.tagPillText}>{item.tag}</Text>
            </View>
            {item.spicyLevel >= 3 && (
              <View style={s.spicyPill}>
                <Flame size={10} color="#DC2626" />
                <Text style={s.spicyText}>Hot</Text>
              </View>
            )}
          </View>
          <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={s.cardFooter}>
            <View style={s.metaRow}>
              <Star size={11} color="#FBBF24" fill="#FBBF24" />
              <Text style={s.metaText}>{item.rating}</Text>
              <Text style={s.metaDot}>·</Text>
              <Clock size={11} color={COLORS.stone400} />
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Toast message={toast} />

      {/* Sticky header */}
      <View style={s.headerWrap}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Good day, {firstName} 👋</Text>
            <Text style={s.subGreeting}>What are you craving today?</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} style={s.avatarBtn}>
            <Image source={{ uri: user.avatar }} style={s.avatar} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Search size={16} color={COLORS.stone400} style={s.searchIco} />
            <TextInput
              style={s.searchInput}
              placeholder="Search dishes..."
              placeholderTextColor={COLORS.stone400}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <View style={s.filterBtn}>
            <SlidersHorizontal size={18} color={COLORS.primary} />
          </View>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.catPill, category === cat && s.catPillActive]}
              onPress={() => setCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[s.catText, category === cat && s.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{filtered.length} dishes</Text>
        <Text style={s.countSub}>in {category === 'All' ? 'all categories' : category}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🍽️</Text>
            <Text style={s.emptyText}>No dishes found</Text>
            <Text style={s.emptySub}>Try a different search or category</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerWrap: { backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: COLORS.stone100 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greeting: { fontSize: 18, fontWeight: '800', color: COLORS.stone900 },
  subGreeting: { fontSize: 12, color: COLORS.stone500, marginTop: 2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.primary },
  avatar: { width: '100%', height: '100%' },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.stone200, borderRadius: 14, paddingHorizontal: 12, elevation: 1 },
  searchIco: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.stone900, paddingVertical: 11 },
  filterBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.stone200, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  cats: { paddingBottom: 10, gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.stone200 },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.stone600 },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
  countText: { fontSize: 13, fontWeight: '800', color: COLORS.stone900 },
  countSub: { fontSize: 12, color: COLORS.stone500 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  card: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.stone100, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardImg: { width: 96, height: 96, resizeMode: 'cover' },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTagRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  tagPill: { backgroundColor: COLORS.amberLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagPillText: { fontSize: 9, fontWeight: '700', color: '#92400E' },
  spicyPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  spicyText: { fontSize: 9, fontWeight: '700', color: '#DC2626' },
  cardName: { fontSize: 13, fontWeight: '800', color: COLORS.stone900, marginBottom: 2 },
  cardDesc: { fontSize: 11, color: COLORS.stone500, lineHeight: 15, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: COLORS.stone600 },
  metaDot: { fontSize: 11, color: COLORS.stone400 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  addBtn: { width: 28, height: 28, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.stone700, marginBottom: 4 },
  emptySub: { fontSize: 13, color: COLORS.stone400 },
});
