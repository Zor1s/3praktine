import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { Alert } from 'react-native';
import { db } from '../db/firebase';
import { Ad } from '../types/Ad';


type State = {
  ads: Ad[];
  isLoading: boolean;
};

type Action =
  | { type: 'LOAD_ADS'; payload: Ad[] }
  | { type: 'ADD_AD'; payload: Ad }
  | { type: 'UPDATE_AD'; payload: Ad }
  | { type: 'DELETE_AD'; payload: string };

type AdContextType = {
  ads: Ad[];
  isLoading: boolean;
  addAd: (adData: Omit<Ad, 'id' | 'firestoreId' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<Ad | null>;
  updateAd: (ad: Ad) => Promise<Ad | null>;
  deleteAd: (firestoreId: string) => Promise<void>;
  getAdById: (id: string) => Ad | undefined;
};

const initialState: State = { ads: [], isLoading: true };


function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_ADS':
      return { ...state, ads: action.payload, isLoading: false };
    case 'ADD_AD':
      return { ...state, ads: [action.payload, ...state.ads] };
    case 'UPDATE_AD':
      return { ...state, ads: state.ads.map((a) => (a.id === action.payload.id ? action.payload : a)) };
    case 'DELETE_AD':
      return { ...state, ads: state.ads.filter((a) => a.id !== action.payload) };
    default:
      return state;
  }
}


const AdContext = createContext<AdContextType | undefined>(undefined);

export const useAdContext = (): AdContextType => {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error('useAdContext must be used within AdProvider');
  return ctx;
};

export const generateId = () =>
  Date.now().toString() + '_' + Math.floor(Math.random() * 1000000).toString();


export const AdProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const auth = getAuth();

  // Užkrauna duomenis iš Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const adsList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          firestoreId: docSnap.id,
          id: data.id,
          title: data.title,
          description: data.description,
          price: data.price,
          categories: data.categories,
          images: data.images,
          contacts: data.contacts,
          username: data.username,
          ownerId: data.ownerId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,

         
          year: data.year,
          mileage: data.mileage,
          fuelType: data.fuelType,
          transmission: data.transmission,
        } as Ad;
      });

      dispatch({ type: 'LOAD_ADS', payload: adsList });
    });

    return () => unsub();
  }, []);

  //
  //  Pridėti skelbimą
  // 
  const addAd: AdContextType['addAd'] = async (adData) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Klaida', 'Privalote būti prisijungę');
      return null;
    }

    const firestoreId = generateId();
    const newAd: Ad = {
      id: Date.now().toString(),
      firestoreId,
      title: adData.title,
      description: adData.description,
      price: adData.price,
      categories: adData.categories,
      images: adData.images,
      contacts: adData.contacts,
      username: adData.username,
      ownerId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),

 
      year: adData.year,
      mileage: adData.mileage,
      fuelType: adData.fuelType,
      transmission: adData.transmission,
    };

    try {
      await setDoc(doc(db, 'ads', firestoreId), newAd);
      return newAd;
    } catch (err) {
      console.error('addAd error:', err);
      Alert.alert('Klaida', 'Nepavyko sukurti skelbimo.');
      return null;
    }
  };

  //
  // Atnaujinti skelbimą
  // 
  const updateAd: AdContextType['updateAd'] = async (ad) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Klaida', 'Turite būti prisijungę');
      return null;
    }

    if (ad.ownerId !== user.uid) {
      Alert.alert('Klaida', 'Negalite redaguoti svetimo skelbimo');
      return null;
    }

    try {
      const updated = {
        ...ad,
        updatedAt: Date.now(),
        year: ad.year,
        mileage: ad.mileage,
        fuelType: ad.fuelType,
        transmission: ad.transmission,
      };
      await updateDoc(doc(db, 'ads', ad.firestoreId), updated);
      return updated;
    } catch (err) {
      console.error('Update ad error:', err);
      Alert.alert('Klaida', 'Nepavyko atnaujinti skelbimo.');
      return null;
    }
  };

  //
  // Ištrinti skelbimą
  //
  const deleteAd: AdContextType['deleteAd'] = async (firestoreId: string) => {
    const user = auth.currentUser;
    const ad = state.ads.find((a) => a.firestoreId === firestoreId);

    if (!user || !ad) {
      Alert.alert('Klaida', 'Negalima ištrinti.');
      return;
    }

    if (ad.ownerId !== user.uid) {
      Alert.alert('Klaida', 'Negalite ištrinti svetimo skelbimo');
      return;
    }

    try {
      await deleteDoc(doc(db, 'ads', firestoreId));
      console.log('Ad deleted:', firestoreId);
    } catch (err) {
      console.error('Delete ad error:', err);
      Alert.alert('Klaida', 'Nepavyko ištrinti skelbimo.');
    }
  };


  const getAdById = (id: string) => state.ads.find((a) => a.id === id);


  return (
    <AdContext.Provider
      value={{
        ads: state.ads,
        isLoading: state.isLoading,
        addAd,
        updateAd,
        deleteAd,
        getAdById,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};
