import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, MapPin, Award, ChevronRight, LogOut, Bell, Shield, HelpCircle, Star } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';
import { API_URL } from '../services/googleAuth';

export default function ProfileScreen({ navigation }) {
  const { user, setUser, showToast } = useCart();
  const [avatar, setAvatar] = useState(user.avatar);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      setUser({ ...user, avatar: uri });
      showToast('Profile photo updated!');
    }
  }

  function signOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          // End the server session too, otherwise a reload signs you straight back in.
          try {
            await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
          } catch (err) {
            // offline - still clear local state below
          }
          setUser({ name: 'Guest User', email: 'guest@savannabites.com', phone: '+234 800 000 0000', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' });
          showToast('Signed out successfully');
          // Navigate from inside MainTabs → go up to root Stack → Landing
          navigation.getParent()?.navigate('Landing');
        },
      },
    ]);
  }

  const menuItems = [
    { icon: Bell, label: 'Notifications', sub: 'Order updates & offers' },
    { icon: Shield, label: 'Privacy & Security', sub: 'Account protection' },
    { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs and contact us' },
    { icon: Star, label: 'Rate the App', sub: 'Tell us what you think' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.headerTitle}>My Profile</Text></View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <Image source={{ uri: avatar }} style={s.avatar} />
            <TouchableOpacity style={s.cameraBtn} onPress={pickImage}>
              <Camera size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={s.name}>{user.name}</Text>
          <Text style={s.email}>{user.email}</Text>
          <Text style={s.phone}>{user.phone}</Text>
        </View>

        {/* VIP card */}
        <View style={s.vipCard}>
          <View style={s.vipLeft}>
            <Award size={22} color="#FBBF24" />
            <View>
              <Text style={s.vipTitle}>Royal VIP Member</Text>
              <Text style={s.vipSub}>240 Spice Points · Level 2</Text>
            </View>
          </View>
          <View style={s.vipBadge}><Text style={s.vipBadgeText}>Active</Text></View>
        </View>

        {/* Saved address */}
        <View style={s.addressCard}>
          <View style={s.addressHeader}>
            <MapPin size={16} color={COLORS.primary} />
            <Text style={s.addressTitle}>Saved Address</Text>
          </View>
          <View style={s.addressBody}>
            <Text style={s.addressLine}>14 Victoria Island, Lagos</Text>
            <Text style={s.addressLine}>Near Eko Hotels, Lagos Island</Text>
            <View style={s.addressTag}><Text style={s.addressTagText}>Home</Text></View>
          </View>
        </View>

        {/* Menu items */}
        <View style={s.menuCard}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={i} style={[s.menuItem, i < menuItems.length - 1 && s.menuItemBorder]} activeOpacity={0.7}>
                <View style={s.menuIconBox}><Icon size={18} color={COLORS.primary} /></View>
                <View style={s.menuContent}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.stone400} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.85}>
          <LogOut size={18} color="#EF4444" />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Savanna Bites v1.0.0 · Artisanal African Gastronomy</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.stone100 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.stone900 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  profileCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.stone100, elevation: 1 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.primary },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  name: { fontSize: 20, fontWeight: '900', color: COLORS.stone900, marginBottom: 4 },
  email: { fontSize: 13, color: COLORS.stone600, marginBottom: 2 },
  phone: { fontSize: 13, color: COLORS.stone600 },
  vipCard: { backgroundColor: COLORS.primary, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vipLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vipTitle: { fontSize: 14, fontWeight: '800', color: COLORS.white, marginBottom: 2 },
  vipSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  vipBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  vipBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  addressCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.stone100, elevation: 1 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  addressTitle: { fontSize: 14, fontWeight: '800', color: COLORS.stone900 },
  addressBody: { paddingLeft: 4 },
  addressLine: { fontSize: 13, color: COLORS.stone600, marginBottom: 3 },
  addressTag: { backgroundColor: COLORS.amberLight, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  addressTagText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  menuCard: { backgroundColor: COLORS.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.stone100, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.stone100 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(27,59,43,0.08)', alignItems: 'center', justifyContent: 'center' },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.stone800, marginBottom: 2 },
  menuSub: { fontSize: 11, color: COLORS.stone500 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderColor: '#FEE2E2', elevation: 1 },
  signOutText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.stone400, marginTop: 4 },
});
