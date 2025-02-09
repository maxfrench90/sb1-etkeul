import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../../components/home/HeroSection';
import { FeaturedServices } from '../../components/home/FeaturedServices';
import { Testimonials } from '../../components/home/Testimonials';
import { ProviderRegistrationButton } from '../../components/ProviderRegistration/ProviderRegistrationButton';

function HomePage() {
  const navigate = useNavigate();

  const handleProviderRegistration = () => {
    navigate('/sign-up?role=provider');
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturedServices />
      <ProviderRegistrationButton onClick={handleProviderRegistration} />
      <Testimonials />
    </div>
  );
}

// Export both default and named export
export { HomePage };
export default HomePage;