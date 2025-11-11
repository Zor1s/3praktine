import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { useAdContext } from '../contexts/AdContext';
import { useUserContext } from '../contexts/UserContext';

export default function AdDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ads, deleteAd } = useAdContext();
  const { currentUser } = useUserContext();
  const router = useRouter();

  const ad = ads.find((a) => a.id === id);
  const [isVisible, setIsVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  if (!ad) return <View style={styles.center}><Text>Skelbimas nerastas</Text></View>;

  const isOwner = currentUser?.username === ad.username;

  const handleDelete = () => {
    Alert.alert('Ištrinti skelbimą', 'Ar tikrai norite ištrinti šį skelbimą?', [
      { text: 'Atšaukti', style: 'cancel' },
      {
        text: 'Ištrinti',
        style: 'destructive',
        onPress: () => {
          deleteAd(ad.firestoreId);
          router.back();
        },
      },
    ]);
  };

  const imagesForViewer = ad.images.map((uri) => ({ uri }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ad.images && ad.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {ad.images.map((uri, index) => (
            <TouchableOpacity key={index} onPress={() => { setImageIndex(index); setIsVisible(true); }}>
              <Image source={{ uri }} style={styles.image} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.title}>{ad.title}</Text>
      <Text style={styles.price}>{ad.price} €</Text>
      <Text style={styles.category}>{ad.categories.join(', ')}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>🗓 Metai: {ad.year}</Text>
        <Text style={styles.infoText}>📍 Rida: {ad.mileage} km</Text>
        <Text style={styles.infoText}>⛽ Kuras: {ad.fuelType}</Text>
        <Text style={styles.infoText}>⚙️ Pavarų dėžė: {ad.transmission}</Text>
      </View>

      <Text style={styles.description}>{ad.description}</Text>

      <Text style={styles.contact}>📞 Kontaktai:</Text>
      <Text style={styles.contactItem}>{ad.contacts.name ?? '-'}</Text>
      <Text style={styles.contactItem}>{ad.contacts.phone ?? '-'}</Text>
      <Text style={styles.contactItem}>{ad.contacts.email ?? '-'}</Text>

      <Text style={styles.contact}>👤 Pardavėjas: {ad.username}</Text>

      {isOwner && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#007AFF' }]}
            onPress={() => router.push({ pathname: '/add', params: { editId: ad.id } })}
          >
            <Text style={styles.buttonText}>Redaguoti</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ff3b30' }]}
            onPress={handleDelete}
          >
            <Text style={styles.buttonText}>Ištrinti</Text>
          </TouchableOpacity>
        </View>
      )}

      <ImageViewing
        images={imagesForViewer}
        imageIndex={imageIndex}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: 220, height: 160, borderRadius: 10, marginRight: 12, resizeMode: 'cover' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  price: { fontSize: 20, fontWeight: '600', color: '#007AFF', marginBottom: 8 },
  category: { fontSize: 15, color: '#555', marginBottom: 8 },
  infoBox: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 12 },
  infoText: { fontSize: 15, color: '#333', marginBottom: 4 },
  description: { fontSize: 16, lineHeight: 22, marginBottom: 12 },
  contact: { fontSize: 16, fontWeight: '600', marginTop: 12, color: '#000' },
  contactItem: { fontSize: 15, color: '#333' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  button: { flex: 1, marginHorizontal: 8, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
