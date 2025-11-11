import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { generateId, useAdContext } from '../contexts/AdContext';
import { useUserContext } from '../contexts/UserContext';
import { Ad, ContactInfo } from '../types/Ad';

const categoriesList = ['Sedanas', 'Hečbekas', 'SUV', 'Universalas', 'Kupė', 'Pikapas'];

export default function AddEditAdScreen() {
  const CLOUDINARY_CLOUD_NAME = 'dhcfmennf';
  const CLOUDINARY_UPLOAD_PRESET = 'unsigned_upload';
  const { currentUser } = useUserContext();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { ads, addAd, updateAd } = useAdContext();
  const router = useRouter();

  const editingAd = ads.find((ad) => ad.id === editId);

  const [title, setTitle] = useState(editingAd?.title || '');
  const [description, setDescription] = useState(editingAd?.description || '');
  const [price, setPrice] = useState(editingAd?.price?.toString() || '');
  const [year, setYear] = useState(editingAd?.year?.toString() || '');
  const [mileage, setMileage] = useState(editingAd?.mileage?.toString() || '');
  const [fuelType, setFuelType] = useState(editingAd?.fuelType || '');
  const [transmission, setTransmission] = useState(editingAd?.transmission || '');
  const [categories, setCategories] = useState<string[]>(editingAd?.categories || []);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const [contacts, setContacts] = useState<ContactInfo>(
    editingAd?.contacts || { name: '', phone: '', email: '' }
  );
  const [images, setImages] = useState<string[]>(editingAd?.images || []);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Reikia leidimo', 'Suteikite prieigą prie galerijos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uploadedUrls: string[] = [];

        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          if (!asset.uri) continue;

          const data = new FormData();
          data.append('file', {
            uri: asset.uri,
            type: 'image/jpeg',
            name: `ad_${Date.now()}_${i}.jpg`,
          } as any);
          data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data,
          });

          if (!res.ok) continue;
          const json = await res.json();
          uploadedUrls.push(json.secure_url);
        }

        setImages((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      console.log('ImagePicker error:', err);
      Alert.alert('Klaida', 'Nepavyko įkelti nuotraukos.');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !price.trim() || !year.trim()) {
      Alert.alert('Klaida', 'Užpildykite visus privalomus laukus.');
      return;
    }

    const numericPrice = parseFloat(price);
    const numericYear = parseInt(year);
    const numericMileage = parseInt(mileage);

    if (isNaN(numericPrice) || numericPrice < 0 || isNaN(numericYear)) {
      Alert.alert('Klaida', 'Patikrinkite laukus.');
      return;
    }

    if (!currentUser) {
      Alert.alert('Klaida', 'Turite būti prisijungę.');
      return;
    }

    try {
      const now = Date.now();
      const ad: Ad = {
        id: editId ?? `${now}`,
        firestoreId: editingAd?.firestoreId ?? generateId(),
        title,
        description,
        price: numericPrice,
        year: numericYear,
        mileage: numericMileage || 0,
        fuelType,
        transmission,
        categories: categories as Ad['categories'],
        images,
        contacts,
        createdAt: editingAd?.createdAt ?? now,
        updatedAt: now,
        username: currentUser.username,
        ownerId: currentUser.uid,
      };

      if (editId) {
        await updateAd(ad);
        Alert.alert('Atnaujinta', 'Skelbimas atnaujintas!');
      } else {
        await addAd(ad);
        Alert.alert('Sukurta', 'Naujas skelbimas pridėtas!');
      }

      router.back();
    } catch (err) {
      console.log('Save ad error:', err);
      Alert.alert('Klaida', 'Nepavyko išsaugoti skelbimo.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Pavadinimas</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Pvz. BMW 320d" />

      <Text style={styles.label}>Aprašymas</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 80 }]}
        multiline
        placeholder="Būklė, komplektacija..."
      />

      <Text style={styles.label}>Kaina (€)</Text>
      <TextInput value={price} onChangeText={setPrice} style={styles.input} keyboardType="numeric" />

      <Text style={styles.label}>Metai</Text>
      <TextInput value={year} onChangeText={setYear} style={styles.input} keyboardType="numeric" />

      <Text style={styles.label}>Rida (km)</Text>
      <TextInput value={mileage} onChangeText={setMileage} style={styles.input} keyboardType="numeric" />

      <Text style={styles.label}>Kuras</Text>
      <TextInput value={fuelType} onChangeText={setFuelType} style={styles.input} placeholder="Dyzelinas" />

      <Text style={styles.label}>Pavarų dėžė</Text>
      <TextInput value={transmission} onChangeText={setTransmission} style={styles.input} placeholder="Automatinė" />

      <Text style={styles.label}>Kategorijos</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setCategoryModalVisible(true)}>
        <Text>{categories.length > 0 ? categories.join(', ') : 'Pasirinkite kategorijas'}</Text>
      </TouchableOpacity>

      {/* Kategorijų modalas */}
      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 10 }}>Pasirinkite kategorijas:</Text>
            <ScrollView style={{ maxHeight: 250 }}>
              {categoriesList.map((cat) => {
                const isSelected = categories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() =>
                      setCategories((prev) =>
                        isSelected ? prev.filter((c) => c !== cat) : [...prev, cat]
                      )
                    }
                    style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                  >
                    <Text style={{ color: isSelected ? '#fff' : '#000' }}>
                      {isSelected ? '✓ ' : ''}{cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.doneButton} onPress={() => setCategoryModalVisible(false)}>
              <Text style={{ color: '#fff' }}>Baigti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Kontaktai */}
      <Text style={styles.label}>Kontaktai</Text>
      <TextInput
        value={contacts.name}
        onChangeText={(v) => setContacts({ ...contacts, name: v })}
        style={styles.input}
        placeholder="Vardas ir pavardė"
        placeholderTextColor="#999"
      />
      <TextInput
        value={contacts.phone}
        onChangeText={(v) => setContacts({ ...contacts, phone: v })}
        style={styles.input}
        keyboardType="phone-pad"
        placeholder="Telefono numeris"
        placeholderTextColor="#999"
      />
      <TextInput
        value={contacts.email}
        onChangeText={(v) => setContacts({ ...contacts, email: v })}
        style={styles.input}
        keyboardType="email-address"
        placeholder="El. paštas"
        placeholderTextColor="#999"
      />

      {/* Nuotraukų įkėlimas */}
      <TouchableOpacity style={[styles.saveButton, { marginBottom: 12 }]} onPress={handlePickImage}>
        <Text style={styles.saveButtonText}>Įkelti nuotrauką</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <Image
          source={{ uri: images[mainImageIndex] }}
          style={{ width: '100%', height: 250, borderRadius: 10, marginBottom: 12 }}
        />
      )}

      {/* Peržiūra */}
      <Text style={styles.previewTitle}>Peržiūra:</Text>
      <View style={styles.previewCard}>
        {images[mainImageIndex] && (
          <Image source={{ uri: images[mainImageIndex] }} style={styles.previewImage} />
        )}
        <Text style={styles.previewTitleText}>{title || 'Pavadinimas'}</Text>
        <Text>{description || 'Aprašymas...'}</Text>
        <Text style={{ color: '#007AFF', fontWeight: '600' }}>
          {price ? `${price} €` : ''}
        </Text>
        <Text>Metai: {year || '—'} | {mileage || '—'} km</Text>
        <Text>Kuras: {fuelType || '—'} | Pavaros: {transmission || '—'}</Text>
        <Text>Kategorijos: {categories.length > 0 ? categories.join(', ') : '—'}</Text>
        <Text>Kontaktai: {contacts.name} {contacts.phone} {contacts.email}</Text>
      </View>

      {/* Išsaugoti */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{editId ? 'Atnaujinti' : 'Sukurti'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fafafa', paddingBottom: 40 },
  label: { fontSize: 15, marginBottom: 4, color: '#333', fontWeight: '500' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  categoryItem: { padding: 12, marginBottom: 8, borderRadius: 8, backgroundColor: '#f2f2f2' },
  categoryItemSelected: { backgroundColor: '#007AFF' },
  doneButton: { backgroundColor: '#007AFF', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  saveButton: { backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  previewTitle: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
  previewTitleText: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
});
