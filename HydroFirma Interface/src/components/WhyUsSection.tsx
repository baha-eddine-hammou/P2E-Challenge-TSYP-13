import { Check, Zap, Shield, Users, Leaf, Clock } from 'lucide-react';

const WhyUsSection = () => {
  const benefits = [
    {
      icon: Leaf,
      title: 'Eco-Friendly',
      description: 'Zero pesticides and 90% less water usage compared to traditional farming.',
    },
    {
      icon: Zap,
      title: 'Energy Independent',
      description: 'Solar-powered systems designed for off-grid Tunisian environments.',
    },
    {
      icon: Shield,
      title: 'Reliable Technology',
      description: 'Robust IoT infrastructure built for harsh agricultural conditions.',
    },
    {
      icon: Users,
      title: 'Local Support',
      description: 'Dedicated Tunisian team providing on-ground assistance and training.',
    },
    {
      icon: Clock,
      title: 'Year-Round Growth',
      description: 'Climate-controlled environments for consistent crop production.',
    },
  ];

  const features = [
    'Real-time pH and temperature monitoring',
    'Automated nutrient delivery system',
    'Mobile app for remote farm management',
    'AI-powered pest detection alerts',
    'Multi-farm dashboard management',
    'Detailed growth analytics and reports',
    'LoRa connectivity up to 15km range',
    'Local data storage and cloud sync',
  ];

  return (
    <section id="why-us" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Why Choose <span className="hydro-gradient-text">HydroFirma</span>?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              We understand the unique challenges faced by Tunisian farmers. Our platform 
              is designed from the ground up to address water scarcity, energy costs, 
              and the need for sustainable agricultural practices.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="hydro-card p-8 lg:p-10">
            <h3 className="font-display text-2xl font-semibold mb-8 text-foreground">
              Platform Features
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
