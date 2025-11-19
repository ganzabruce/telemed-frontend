import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Menu, X, Search, ShoppingBag, MessageSquare, Package, Truck, ClipboardList, Linkedin, Facebook, Heart, Stethoscope, Phone, Video } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import heroImage from "../assets/hero-healthcare.jpg";
import providersImage from "../assets/healthcare-providers.jpg";
import checkupImage from "../assets/medical-checkup.jpg";
import { getServices, getTeamMembers, getInsurancePartners, type Service, type TeamMember, type InsurancePartner } from "../api/landingApi";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

// Navigation Component
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "About", href: "#about" },
    { name: "Team", href: "#team" },
    { name: "Login", href: "/login" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
                <img src="/telemedLanding.png" alt="TeleMed" className="w- h-8 rounded-full" />
            
            <span className="font-bold text-xl text-blue-900">TeleMedicine</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-blue-900 hover:text-blue-700 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <button
            className="md:hidden text-blue-900"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-2 text-blue-900 hover:text-blue-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

// Hero Component
const Hero = () => {
  return (
    <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div data-aos="fade-right" data-aos-duration="800">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-blue-900 mb-6 leading-tight">
              Trusted, modern healthcare for every Rwandan
            </h1>
            <p className="text-blue-900/75 text-base mb-8 leading-relaxed">
              Accessible, reliable healthcare—online consultations, prescriptions, and support
              from experienced professionals.
            </p>
            <Link to="/login">
            <Button className="rounded-full px-8 py-3 text-lg bg-blue-900 text-white hover:opacity-95">
              Get Started
            </Button>
            </Link>
          </div>

          <div data-aos="fade-left" data-aos-duration="800" data-aos-delay="200">
            <img
              src={heroImage}
              alt="Healthcare professionals with digital health records"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Icon mapping function
const getIconComponent = (iconName: string | null): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    Search,
    ShoppingBag,
    MessageSquare,
    ClipboardList,
    Package,
    Truck,
    Heart,
    Stethoscope,
    Phone,
    Video,
  };
  return iconMap[iconName || ''] || Search; // Default to Search if not found
};

// Services Component
const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const displayedServices = showAll ? services : services.slice(0, 6);

  if (loading) {
    return (
      <section id="services" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-blue-900/70">Loading services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null; // Don't show section if no services
  }

  return (
    <section id="services" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-4">
            Our services
          </h2>
          <div className="w-16 h-1 bg-blue-900 mx-auto mb-6"></div>
          <p className="text-blue-900/70 max-w-2xl mx-auto">
            A concise set of services designed to make care simple and effective.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedServices.map((service, index) => {
            const IconComponent = getIconComponent(service.icon);
            return (
              <Card
                key={service.id}
                className="border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-white border border-border rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-blue-900" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-blue-900/70 leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {services.length > 6 && (
          <div className="text-center mt-12" data-aos="fade-up">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-900 font-medium border-2 border-blue-900 px-8 py-3 rounded-full hover:bg-blue-900 hover:text-white transition-colors"
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// About Section Component
const AboutSection = () => {
  return (
    <section id="about" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div data-aos="fade-up" data-aos-duration="100">
            <img
              src={providersImage}
              alt="Healthcare providers collaborating"
              className="w-full h-auto rounded-2xl"
            />
          </div>

          <div data-aos="fade-up" data-aos-duration="100">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-6">
              Trusted healthcare partners
            </h2>
            <div className="w-16 h-1 bg-blue-900 mb-6"></div>
            <p className="text-blue-900/75 text-base mb-6 leading-relaxed">
              Collaborating with leading providers to bring you consistent, high-quality care.
            </p>
            <Link to="/login">  
            <Button className="rounded-full px-8 border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors">
              Learn more
            </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// Special Offer Component
const SpecialOffer = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div data-aos="fade-up" data-aos-duration="100">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-6">
              Save on your first checkup
            </h2>
            <div className="w-16 h-1 bg-blue-900 mb-6"></div>
            <p className="text-blue-900/75 text-base mb-8 leading-relaxed">
              Join today and receive a discount on your initial comprehensive checkup.
            </p>
            <Link to="/login">
            <Button className="rounded-full px-8 border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors">
              Learn More
            </Button>
            </Link>
          </div>

          <div data-aos="fade-up" data-aos-duration="100">
            <img
              src={checkupImage}
              alt="Medical checkup illustration"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Insurance Partners Component
const InsurancePartners = () => {
  const [partners, setPartners] = useState<InsurancePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const data = await getInsurancePartners();
        setPartners(data);
      } catch (error) {
        console.error('Error fetching insurance partners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-blue-900/70">Loading insurance partners...</p>
          </div>
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return null; // Don't show section if no partners
  }

  const displayedPartners = showAll ? partners : partners.slice(0, 6);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-8">
            Our insurance partners
          </h2>
        </div>
        
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPartners.map((partner, index) => (
            <Card
              key={partner.id}
              className="bg-white border border-border shadow-sm p-6 hover:shadow-md transition-shadow"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex items-center gap-4 w-full">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="w-16 h-16 rounded-full object-cover border border-border shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const placeholder = (e.target as HTMLImageElement).parentElement?.querySelector('.logo-placeholder');
                          if (placeholder) {
                            placeholder.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-16 h-16 rounded-full bg-white border border-border flex items-center justify-center logo-placeholder shrink-0 ${partner.logoUrl ? 'hidden' : ''}`}>
                      <span className="text-blue-900 font-bold text-2xl">
                        {partner.logoInitial || partner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-xl mb-1">{partner.name}</h3>
                      <p className="text-primary-foreground/80 text-sm">Healthcare services provider</p>
                    </div>
                  </div>

                  <div className="w-full">
                    <p className="text-blue-900/75 text-sm">
                      {partner.description}
                    </p>
                    {partner.websiteUrl && (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                      >
                        Visit website →
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {partners.length > 6 && (
          <div className="text-center mt-12" data-aos="fade-up">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-900 font-medium border-2 border-blue-900 px-8 py-3 rounded-full hover:bg-blue-900 hover:text-white transition-colors"
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// Team Component
const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const data = await getTeamMembers();
        setTeamMembers(data);
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleReadMore = (member: TeamMember) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const displayedMembers = showAll ? teamMembers : teamMembers.slice(0, 3);

  if (loading) {
    return (
      <section id="team" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-blue-900/70">Loading team...</p>
          </div>
        </div>
      </section>
    );
  }

  if (teamMembers.length === 0) {
    return null; // Don't show section if no team members
  }

  return (
    <section id="team" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-4">
            Our Team
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet our dedicated healthcare professionals committed to your wellbeing
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {displayedMembers.map((member, index) => (
            <Card
              key={member.id}
              className="border-none shadow-lg hover:shadow-xl transition-shadow"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <CardContent className="p-6">
                <div className="mb-4 overflow-hidden rounded-lg">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">{member.name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-900/70 mb-4">{member.role}</p>
                {member.bio && (
                  <p className="text-sm text-blue-900/60 mb-4 line-clamp-2">
                    {member.bio.length > 100 ? `${member.bio.substring(0, 100)}...` : member.bio}
                  </p>
                )}

                <div className="flex gap-3 mb-4">
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-blue-900 hover:text-white transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={18} />
                    </a>
                  )}
                  {member.facebookUrl && (
                    <a
                      href={member.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-blue-900 hover:text-white transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook size={18} />
                    </a>
                  )}
                </div>

                {member.bio && member.bio.length > 100 && (
                  <button
                    onClick={() => handleReadMore(member)}
                    className="w-full text-blue-900 text-sm font-medium hover:underline flex items-center justify-start"
                  >
                    Read more →
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {teamMembers.length > 3 && (
          <div className="text-center mt-12" data-aos="fade-up">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-900 font-medium border-2 border-blue-900 px-8 py-3 rounded-full hover:bg-blue-900 hover:text-white transition-colors"
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          </div>
        )}
      </div>

      {/* Team Member Detail Modal */}
      {showModal && selectedMember && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => {
              setShowModal(false);
              setSelectedMember(null);
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-blue-900">Team Member Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedMember(null);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  {selectedMember.imageUrl ? (
                    <img
                      src={selectedMember.imageUrl}
                      alt={selectedMember.name}
                      className="w-48 h-48 rounded-full object-cover border-4 border-gray-200 shadow-lg mx-auto md:mx-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center mx-auto md:mx-0">
                      <span className="text-6xl text-gray-400">{selectedMember.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-blue-900 mb-2">
                      {selectedMember.name}
                    </h3>
                    <p className="text-xl text-blue-700 mb-4">{selectedMember.role}</p>
                    <div className="flex gap-3 justify-center md:justify-start">
                      {selectedMember.linkedinUrl && (
                        <a
                          href={selectedMember.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 transition-colors"
                          aria-label="LinkedIn"
                        >
                          <Linkedin size={20} />
                        </a>
                      )}
                      {selectedMember.facebookUrl && (
                        <a
                          href={selectedMember.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 transition-colors"
                          aria-label="Facebook"
                        >
                          <Facebook size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {selectedMember.bio && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">About</h4>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {selectedMember.bio}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedMember(null);
                    }}
                    className="w-full px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-blue-100 text-blue-900 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
            
              <img src="/telemedLanding.png" alt="TeleMed" className="w-8 h-8 rounded-full" />
              <span className="font-bold text-lg">TeleMedicine</span>
            </div>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Quality healthcare services that you can trust. Committed to excellence in patient care.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center hover:bg-blue-900/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center hover:bg-blue-900/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-blue-900/80 hover:text-blue-900 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#services" className="text-blue-900/80 hover:text-blue-900 transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#about" className="text-blue-900/80 hover:text-blue-900 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#team" className="text-blue-900/80 hover:text-blue-900 transition-colors">
                  Our Team
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li className="text-blue-900/80">Online Pharmacy</li>
              <li className="text-blue-900/80">Consultation</li>
              <li className="text-blue-900/80">Counseling</li>
              <li className="text-blue-900/80">Medicine Delivery</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Help</h3>
            <ul className="space-y-2">
              <li className="text-blue-900/80">FAQs</li>
              <li className="text-blue-900/80">Contact Us</li>
              <li className="text-blue-900/80">Privacy Policy</li>
              <li className="text-blue-900/80">Terms of Service</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-900/20 pt-8 text-center">
          <p className="text-blue-900/80 text-sm">
            © {new Date().getFullYear()} TeleMedicine. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Main Index Component
const LandingPage = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Services />
      <AboutSection />
      <SpecialOffer />
      <InsurancePartners />
      <Team />
      <Footer />
    </div>
  );
};

export default LandingPage;
