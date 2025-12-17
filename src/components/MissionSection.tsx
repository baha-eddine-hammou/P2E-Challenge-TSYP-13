import { Target, TrendingUp, Globe } from 'lucide-react';

const MissionSection = () => {
  return (
    <section id="mission" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Our <span className="hydro-gradient-text">Mission</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            To revolutionize agriculture in Tunisia by making sustainable, technology-driven 
            farming accessible to every farmer, ensuring food security while preserving our 
            precious natural resources.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: 'Sustainable Agriculture',
              description:
                'We are committed to reducing environmental impact through closed-loop hydroponic systems that minimize water waste and eliminate harmful pesticides.',
            },
            {
              icon: TrendingUp,
              title: 'Farmer Empowerment',
              description:
                'Our platform provides Tunisian farmers with cutting-edge technology, real-time data, and insights to maximize yields and profitability.',
            },
            {
              icon: Globe,
              title: 'Food Security',
              description:
                'By enabling year-round crop production regardless of climate conditions, we help ensure a stable food supply for local communities.',
            },
          ].map((item, index) => (
            <div
              key={index}
              className="hydro-card p-8 group hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-4 text-foreground">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
