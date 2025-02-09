export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'provider';
  rating: number;
  reviews: number;
  verified: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  rating: number;
  reviews: number;
  location: Location;
  provider: Provider;
}

export interface Booking {
  id: string;
  client_id: string;
  provider_id: string;
  service_type: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    full_name: string;
    email: string;
  };
  provider?: {
    id: string;
    full_name: string;
    email: string;
  };
  payment?: {
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
  };
}