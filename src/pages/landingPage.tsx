import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Menu, X, Search, ShoppingBag, MessageSquare, Package, Truck, ClipboardList, Linkedin, Facebook } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import heroImage from "../assets/hero-healthcare.jpg";
import providersImage from "../assets/healthcare-providers.jpg";
import checkupImage from "../assets/medical-checkup.jpg";

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
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border">
              <span className="text-blue-900 font-bold text-sm">T</span>
            </div>
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
            <Button className="rounded-full px-8 py-3 text-lg bg-blue-900 text-white hover:opacity-95">
              Get Started
            </Button>
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

// Services Component
const Services = () => {
  const services = [
    {
      icon: Search,
      title: "Best Quality HealthCare",
      description: "Comprehensive medical services with state-of-the-art facilities and expert care",
    },
    {
      icon: ShoppingBag,
      title: "Online pharmacy",
      description: "Order your prescriptions online and get them delivered to your doorstep",
    },
    {
      icon: MessageSquare,
      title: "Consultation",
      description: "Connect with healthcare professionals for expert medical advice",
    },
    {
      icon: ClipboardList,
      title: "Counseling",
      description: "Professional mental health support and guidance for your wellbeing",
    },
    {
      icon: Package,
      title: "Medicine Delivery",
      description: "Fast and reliable delivery of medications right to your home",
    },
    {
      icon: Truck,
      title: "Tracking",
      description: "Real-time tracking of your orders and appointment schedules",
    },
  ];

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
          {services.map((service, index) => (
            <Card
              key={index}
              className="border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white border border-border rounded-full flex items-center justify-center mx-auto mb-6">
                  <service.icon className="w-8 h-8 text-blue-900" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-blue-900/70 leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12" data-aos="fade-up">
          <button className="text-blue-900 font-medium hover:underline">
            Learn more
          </button>
        </div>
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
          <div data-aos="fade-right" data-aos-duration="800">
            <img
              src={providersImage}
              alt="Healthcare providers collaborating"
              className="w-full h-auto rounded-2xl"
            />
          </div>

          <div data-aos="fade-left" data-aos-duration="800" data-aos-delay="200">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-6">
              Trusted healthcare partners
            </h2>
            <div className="w-16 h-1 bg-blue-900 mb-6"></div>
            <p className="text-blue-900/75 text-base mb-6 leading-relaxed">
              Collaborating with leading providers to bring you consistent, high-quality care.
            </p>
            <Button className="rounded-full px-8 border border-blue-900 text-blue-900">
              Learn more
            </Button>
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
          <div data-aos="fade-right" data-aos-duration="800">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-6">
              Save on your first checkup
            </h2>
            <div className="w-16 h-1 bg-blue-900 mb-6"></div>
            <p className="text-blue-900/75 text-base mb-8 leading-relaxed">
              Join today and receive a discount on your initial comprehensive checkup.
            </p>
            <Button className="rounded-full px-8 border border-blue-900 text-blue-900">
              Learn More
            </Button>
          </div>

          <div data-aos="fade-left" data-aos-duration="800" data-aos-delay="200">
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
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-8">
            Our insurance partners
          </h2>
        </div>
        <Card className="bg-white border border-border shadow-sm p-6" data-aos="zoom-in" data-aos-duration="800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white border border-border flex items-center justify-center">
                  <span className="text-blue-900 font-bold text-2xl">B</span>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Britam Insurance</h3>
                  <p className="text-primary-foreground/80">Healthcare services provider</p>
                </div>
              </div>

              <div className="max-w-md text-center md:text-left">
                <p className="text-blue-900/75">
                  Britam is one of Rwanda's leading insurance providers, offering comprehensive 
                  healthcare coverage to ensure quality medical care for all.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2 mt-8" data-aos="fade-up">
          <div className="w-3 h-3 rounded-full bg-blue-900"></div>
          <div className="w-3 h-3 rounded-full bg-muted"></div>
          <div className="w-3 h-3 rounded-full bg-muted"></div>
        </div>
      </div>
    </section>
  );
};

// Team Component
const Team = () => {
  const teamMembers = [
    {
      name: "Mr. Vincent MUVUNABEZA",
      role: "CEO and Founder",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
    },
    {
      name: "Mr. Jean Peter MUNDERAWANA",
      role: "Operations Manager",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    },
    {
      name: "Mr. Salomon NIYIGENA",
      role: "Medical Director",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    },
  ];

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
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="border-none shadow-lg hover:shadow-xl transition-shadow"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <CardContent className="p-6">
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full aspect-square object-cover"
                  />
                </div>

                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-900/70 mb-4">{member.role}</p>

                <div className="flex gap-3">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-blue-900 hover:text-white transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={18} />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-blue-900 hover:text-white transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook size={18} />
                    </a>
                </div>

                <button className="mt-4 text-blue-900 text-sm font-medium hover:underline">
                  Read more →
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12" data-aos="fade-up">
          <button className="text-blue-900 font-medium border-2 border-blue-900 px-8 py-3 rounded-full hover:bg-blue-900 hover:text-white transition-colors">
            View All
          </button>
        </div>
      </div>
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
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <span className="text-blue-900 font-bold text-sm">T</span>
              </div>
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
