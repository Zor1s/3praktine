import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AdItem from '../components/AdItem';
import { useAdContext } from '../contexts/AdContext';
import { useUserContext } from '../contexts/UserContext';

const categoriesList = ['Sedanas', 'Hečbekas', 'SUV', 'Universalas', 'Kupė', 'Pikapas'];

export default function HomeScreen() {
  const router = useRouter();
  const { ads, isLoading } = useAdContext();
  const { currentUser, logout } = useUserContext();

  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const toggleCategory = (cat: string) => {
    if (cat === 'Visi') {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearch('');
    setShowOnlyMine(false);
  };

  const filteredAds = useMemo(() => {
    const q = search.trim().toLowerCase();

    return ads.filter((ad) => {
      const adCategories: string[] = Array.isArray(ad.categories)
        ? ad.categories
        : ad.categories
        ? [ad.categories]
        : [];

      const matchCategory =
        selectedCategories.length === 0 ||
        adCategories.some((c) => selectedCategories.includes(c));

      const matchUser = !showOnlyMine || (currentUser && ad.username === currentUser.username);

      const matchSearch =
        q.length === 0 ||
        ad.title.toLowerCase().includes(q) ||
        ad.price.toString().includes(q) ||
        ad.year?.toString().includes(q);

      return matchCategory && matchUser && matchSearch;
    });
  }, [ads, selectedCategories, search, showOnlyMine, currentUser]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#555" />
        <Text>Kraunama...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AutoSkelbk</Text>
        {currentUser ? (
          <TouchableOpacity onPress={logout} style={styles.profileButton}>
            <Text style={{ color: '#fff' }}>Atsijungti ({currentUser.username})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.profileButton}>
            <Text style={{ color: '#fff' }}>Prisijungti</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtrų valdymas */}
      <View style={styles.filterActions}>
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterOpenButton}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Filtrai ⚙️</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={clearFilters}>
          <Text style={{ color: '#007AFF', marginLeft: 10 }}>Išvalyti filtrus</Text>
        </TouchableOpacity>
      </View>

      {/* Skelbimų sąrašas */}
      {filteredAds.length === 0 ? (
        <View style={styles.center}>
          <Text>Skelbimų nėra</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAds}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AdItem
              ad={item}
              onPress={(ad) =>
                router.push({
                  pathname: '/ad/[id]',
                  params: { id: ad.id },
                } as any)
              }
            />
          )}
        />
      )}

      {/* Filtrų Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Filtrai</Text>

            <TextInput
              placeholder="Ieškoti pagal markę, metus ar kainą..."
              value={search}
              onChangeText={setSearch}
              style={styles.input}
            />

            {currentUser && (
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterButton, !showOnlyMine && styles.filterButtonActive]}
                  onPress={() => setShowOnlyMine(false)}
                >
                  <Text style={!showOnlyMine ? styles.filterTextActive : styles.filterText}>
                    Visi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, showOnlyMine && styles.filterButtonActive]}
                  onPress={() => setShowOnlyMine(true)}
                >
                  <Text style={showOnlyMine ? styles.filterTextActive : styles.filterText}>
                    Mano skelbimai
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Kategorijų pasirinkimas */}
            <Text style={styles.modalSubtitle}>Kategorijos</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {categoriesList.map((cat) => {
                const isActive = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[
                      styles.categoryButton,
                      isActive && styles.categoryButtonActive,
                    ]}
                  >
                    <Text
                      style={{
                        color: isActive ? '#fff' : '#000',
                        fontWeight: isActive ? '600' : '400',
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Uždaryti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pridėti skelbimą */}
      {currentUser && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add')}
        >
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  profileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterOpenButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  modalSubtitle: { fontSize: 15, fontWeight: '600', marginTop: 10, marginBottom: 5 },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: { backgroundColor: '#007AFF22', borderColor: '#007AFF' },
  filterText: { color: '#333' },
  filterTextActive: { color: '#007AFF', fontWeight: '600' },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#007AFF',
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  addButtonText: { color: '#fff', fontSize: 32, marginTop: -3 },
});
