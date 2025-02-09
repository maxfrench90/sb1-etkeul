import React from 'react';
import { Star } from 'lucide-react';

export function FeaturedServices() {
  const services = [
    {
      id: 1,
      title: "Professional Dog Walking",
      provider: "Emma Thompson",
      rating: 4.9,
      reviews: 128,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80"
    },
    {
      id: 2,
      title: "Pet Grooming Services",
      provider: "James Wilson",
      rating: 4.8,
      reviews: 96,
      image: "https://images.unsplash.com/photo-1516734212186-65266f46a4a7?auto=format&fit=crop&q=80"
    },
    {
      id: 3,
      title: "In-Home Pet Sitting",
      provider: "Sarah Davis",
      rating: 4.9,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src={service.image} alt={service.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">by {service.provider}</p>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="ml-2 text-gray-700">{service.rating}</span>
                  <span className="ml-2 text-gray-500">({service.reviews} reviews)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}