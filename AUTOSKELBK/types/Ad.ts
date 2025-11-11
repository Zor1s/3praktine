export type ContactInfo = {
  name?: string;
  phone?: string;
  email?: string;
};

// types/Ad.ts
export type Ad = {
  id: string;
  title: string;
  description: string;
  price: number;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  categories: (
    | 'Sedanas'
    | 'Hečbekas'
    | 'SUV'
    | 'Universalas'
    | 'Kupė'
    | 'Pikapas'
  )[];
  images: string[];
  contacts: ContactInfo;
  createdAt: number;
  updatedAt?: number;
  username: string;
  ownerId: string;
  firestoreId: string;
};
