import { useEffect} from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Navigation } from "@/pages/landing/components/navigation";
import { Hero } from "./landing/components/hero";
import { Services } from "./landing/components/services";
import { AboutSection } from "./landing/components/aboutSection";
import { InsurancePartners } from "./landing/components/insurancePartners";
import { Footer } from "./landing/components/Footer";
import { Team } from "./landing/components/team";

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

      <InsurancePartners />
      <Team />
      <Footer />
    </div>
  );
};

export default LandingPage;
