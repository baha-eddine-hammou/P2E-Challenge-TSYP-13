import { Linkedin, Twitter, Mail } from 'lucide-react';
import azizPic from '../pictures/pic.jpg';
import bahaPic from '../pictures/baha.jpg';
import maramPic from '../pictures/maram.png';
import fatmaPic from '../pictures/fatma.jpg';
import yasmeenPic from '../pictures/yesmine.jpeg';
import mariemPic from '../pictures/mariem.jpg';
import aminePic from '../pictures/amine.jpg';
import molkaPic from '../pictures/molka.jpg';

const TeamSection = () => {
  const team = [
    {
      name: 'Baha Eddine Hammou',
      role: 'CEO & Founder',
      bio: 'IoT engineer with a passion for sustainable agriculture and technology.',
      avatar: 'BH',
      image: bahaPic,
      linkedin: 'https://www.linkedin.com/in/baha-eddine-hammou/',
      email: '',
    },
    {
      name: 'Aziz Barhoumi',
      role: 'CTO',
      bio: 'Data scientist specializing in AI and machine learning for agriculture.',
      avatar: 'AB',
      image: azizPic,
      linkedin: 'https://www.linkedin.com/in/aziz-barhoumi-320bb9339/',
      email: 'azizbr438@gmail.com',
    },
    {
      name: 'Maram Belgharat',
      role: 'Electrical Engineer',
      bio: 'Electrical Engineer with a passion for sustainable agriculture and technology.',
      image: maramPic,
      avatar: 'MB',
      linkedin: 'https://www.linkedin.com/in/belgharat-maram-982179242/',
      email: 'maram_belgharat@ieee.org',
    },
    {
      name: 'Fatma Hamzaoui',
      role: 'Electrical Engineer',
      bio: 'Electrical Engineer with a passion for sustainable agriculture and technology.',
      avatar: 'FH',
      image: fatmaPic,
      linkedin: 'https://www.linkedin.com/in/fatma-hamzaoui-a8768a336/',
      email: '',
    },
    {
      name: 'Yasmeen ElHorry',
      role: 'Civil Engineer',
      bio: 'Civil Engineer with a passion for sustainable agriculture and technology.',
      avatar: 'Yh',
      image: yasmeenPic,
      linkedin: 'https://www.linkedin.com/in/yesmine-elhorry-civil-engineer/',
      email: 'yesmine.elhorry@ieee.org',
    },
    {
      name: 'Mariem Ben Ounich',
      role: 'Civil Engineer',
      bio: 'Civil Engineer with a passion for sustainable agriculture and technology.',
      avatar: 'MBO',
      image: mariemPic,
      linkedin: 'https://www.linkedin.com/in/mariem-ben-yahia-ounich-b26ab1337/',
      email: '',
    },
    {
      name: 'Amine Ben Hlel',
      role: 'Electrical Engineer',
      bio: 'Electrical Engineer with a passion for sustainable agriculture and technology.',
      avatar: 'ABH',
      image: aminePic,
      linkedin: 'https://www.linkedin.com/in/med-amine-ben-helal/',
      email: '',
    },
    {
      name: 'Molka Wesleti',
      role: 'Electrical Engineer',
      bio: 'Electrical Engineer with a passion for sustainable agriculture and technology.',
      avatar: 'MW',
      image: molkaPic,
      linkedin: 'https://www.linkedin.com/in/molka-weslati/',
      email: '',
    },
  ];

  return (
    <section id="team" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Meet Our <span className="hydro-gradient-text">Team</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A passionate team of engineers, scientists, and agricultural experts
            dedicated to transforming Tunisian agriculture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="hydro-card p-6 text-center group hover:shadow-lg transition-all duration-300"
            >
              {/* Avatar */}
              <div className="w-24 h-24 mx-auto rounded-full bg-hero-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display text-2xl font-bold text-primary-foreground">
                    {member.avatar}
                  </span>
                )}
              </div>

              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                {member.name}
              </h3>
              <p className="text-sm text-primary font-medium mb-4">{member.role}</p>
              <p className="text-sm text-muted-foreground mb-6">{member.bio}</p>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-4">
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
