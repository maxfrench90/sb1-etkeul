import { Service } from '../types';

export const SAMPLE_SERVICES: Service[] = [
  {
    id: '1',
    title: 'Professional Dog Walking',
    description: 'Experienced dog walker available for daily walks in Sydney CBD',
    price: 35,
    duration: 60,
    category: 'walking',
    rating: 4.8,
    reviews: 156,
    location: {
      lat: -33.8688,
      lng: 151.2093,
      address: 'Sydney, NSW'
    },
    provider: {
      id: 'p1',
      name: 'Emma Thompson',
      email: 'emma@petpathways.com.au',
      avatar: 'https://source.unsplash.com/300x300/?portrait,woman',
      role: 'provider',
      rating: 4.9,
      reviews: 203,
      verified: true
    }
  },
  {
    id: '2',
    title: 'Mobile Pet Grooming',
    description: 'Full-service mobile grooming for dogs and cats in Melbourne',
    price: 85,
    duration: 90,
    category: 'grooming',
    rating: 4.7,
    reviews: 89,
    location: {
      lat: -37.8136,
      lng: 144.9631,
      address: 'Melbourne, VIC'
    },
    provider: {
      id: 'p2',
      name: 'James Wilson',
      email: 'james@petpathways.com.au',
      avatar: 'https://source.unsplash.com/300x300/?portrait,man',
      role: 'provider',
      rating: 4.7,
      reviews: 156,
      verified: true
    }
  },
  {
    id: '3',
    title: 'Pet Sitting & Home Visits',
    description: 'Caring in-home pet sitting services in Brisbane',
    price: 45,
    duration: 30,
    category: 'sitting',
    rating: 4.9,
    reviews: 124,
    location: {
      lat: -27.4698,
      lng: 153.0251,
      address: 'Brisbane, QLD'
    },
    provider: {
      id: 'p3',
      name: 'Sophie Chen',
      email: 'sophie@petpathways.com.au',
      avatar: 'https://source.unsplash.com/300x300/?portrait,asian',
      role: 'provider',
      rating: 4.8,
      reviews: 178,
      verified: true
    }
  }
];