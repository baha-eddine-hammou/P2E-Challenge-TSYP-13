import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import MissionSection from '@/components/MissionSection';
import IntegratedSystemsSection from '@/components/IntegratedSystemsSection';
import WhyUsSection from '@/components/WhyUsSection';
import TeamSection from '@/components/TeamSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

const Index = () => {
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSignInClick={handleSignInClick} />
      <HeroSection onSignInClick={handleSignInClick} />
      <MissionSection />
      <IntegratedSystemsSection />
      <WhyUsSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
