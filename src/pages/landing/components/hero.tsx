import "aos/dist/aos.css";
import { Button } from "../../../components/ui/button";
import heroImage from "../../../assets/hero-healthcare.jpg";

import { Link } from "react-router-dom";

export const Hero = () => {
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