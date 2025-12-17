import { Button } from '@/components/ui/button';
import { ArrowRight, Leaf, Droplets, Sun, Wifi } from 'lucide-react';

interface HeroSectionProps {
  onSignInClick: () => void;
}

const HeroSection = ({ onSignInClick }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-nature-gradient" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-hydro-emerald/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-hydro-teal/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hydro-ocean/5 rounded-full blur-3xl" />

      {/* Floating Icons */}
      <div className="absolute top-32 left-[15%] animate-float opacity-30">
        <Leaf className="w-12 h-12 text-hydro-leaf" />
      </div>
      <div className="absolute top-48 right-[20%] animate-float opacity-30" style={{ animationDelay: '1s' }}>
        <Droplets className="w-10 h-10 text-hydro-teal" />
      </div>
      <div className="absolute bottom-48 left-[25%] animate-float opacity-30" style={{ animationDelay: '2s' }}>
        <Sun className="w-14 h-14 text-hydro-amber" />
      </div>
      <div className="absolute bottom-32 right-[15%] animate-float opacity-30" style={{ animationDelay: '0.5s' }}>
        <Wifi className="w-8 h-8 text-hydro-ocean" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Smart Hydroponics for Tunisia</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Grow Smarter with{' '}
            <span className="hydro-gradient-text">HydroFirma</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Empowering Tunisian farmers with IoT-enabled smart hydroponics.
            Reduce water consumption by 90%, eliminate pesticides, and grow year-round
            with solar-powered, off-grid technology.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" onClick={onSignInClick}>
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="heroOutline"
              size="xl"
              onClick={() => document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '90%', label: 'Less Water' },
              { value: '100%', label: 'Pesticide Free' },
              { value: '24/7', label: 'Monitoring' },
            ].map((stat, index) => (
              <div key={index} className="hydro-card p-4 lg:p-6">
                <div className="font-display text-2xl lg:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
