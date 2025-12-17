import { Cpu, Eye, Radio, Sun, Droplets, BarChart3 } from 'lucide-react';

const IntegratedSystemsSection = () => {
  const systems = [
    {
      icon: Cpu,
      title: 'IoT Sensors',
      description: 'Advanced sensors monitoring pH, temperature, humidity, and nutrient levels in real-time.',
      color: 'from-hydro-emerald to-hydro-teal',
    },
    {
      icon: Eye,
      title: 'Computer Vision',
      description: 'AI-powered pest detection and plant health monitoring for early intervention.',
      color: 'from-hydro-teal to-hydro-ocean',
    },
    {
      icon: Radio,
      title: 'LoRa Communication',
      description: 'Long-range, low-power communication enabling multi-farm management from anywhere.',
      color: 'from-hydro-ocean to-hydro-emerald',
    },
    {
      icon: Sun,
      title: 'Solar Powered',
      description: 'Complete off-grid operation with sustainable solar energy systems.',
      color: 'from-hydro-amber to-hydro-amber-light',
    },
    {
      icon: Droplets,
      title: 'Closed-Loop System',
      description: 'Recirculating nutrient solution reducing water consumption by up to 90%.',
      color: 'from-hydro-teal-light to-hydro-teal',
    },
    {
      icon: BarChart3,
      title: 'Smart Dashboard',
      description: 'Intuitive interface for monitoring, analytics, and remote farm management.',
      color: 'from-hydro-emerald-light to-hydro-emerald',
    },
  ];

  return (
    <section id="systems" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Integrated <span className="hydro-gradient-text">Systems</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our platform combines cutting-edge technologies to create a seamless, 
            intelligent agricultural ecosystem that works for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((system, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${system.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${system.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <system.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                  {system.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{system.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegratedSystemsSection;
