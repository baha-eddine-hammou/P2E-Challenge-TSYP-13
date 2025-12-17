import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Droplets, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSignInClick: () => void;
}

const Navbar = ({ onSignInClick }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Hydro<span className="text-primary">Firma</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('mission')}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Mission
            </button>
            <button
              onClick={() => scrollToSection('systems')}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Systems
            </button>
            <button
              onClick={() => scrollToSection('why-us')}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Why Us
            </button>
            <button
              onClick={() => scrollToSection('team')}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Team
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Contact Us
            </button>
          </div>

          {/* Sign In Button */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="hero" size="lg" onClick={onSignInClick}>
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-md animate-fade-in">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('mission')}
                className="px-4 py-2 text-left text-foreground/80 hover:text-primary transition-colors font-medium"
              >
                Mission
              </button>
              <button
                onClick={() => scrollToSection('systems')}
                className="px-4 py-2 text-left text-foreground/80 hover:text-primary transition-colors font-medium"
              >
                Systems
              </button>
              <button
                onClick={() => scrollToSection('why-us')}
                className="px-4 py-2 text-left text-foreground/80 hover:text-primary transition-colors font-medium"
              >
                Why Us
              </button>
              <button
                onClick={() => scrollToSection('team')}
                className="px-4 py-2 text-left text-foreground/80 hover:text-primary transition-colors font-medium"
              >
                Team
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-4 py-2 text-left text-foreground/80 hover:text-primary transition-colors font-medium"
              >
                Contact Us
              </button>
              <div className="px-4 pt-2">
                <Button variant="hero" className="w-full" onClick={onSignInClick}>
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
