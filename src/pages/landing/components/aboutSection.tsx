import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import providersImage from "../../../assets/healthcare-providers.jpg";
import { CheckCircle2, Users, Award, Globe } from "lucide-react";

export const AboutSection = () => {
  const highlights = [
    {
      icon: CheckCircle2,
      title: "Certified Professionals",
      description: "All healthcare providers are licensed and verified",
    },
    {
      icon: Users,
      title: "Patient-Centric Care",
      description: "Your health and privacy are our top priorities",
    },
    {
      icon: Award,
      title: "Quality Assured",
      description: "Maintaining highest standards of medical practice",
    },
    {
      icon: Globe,
      title: "Nationwide Coverage",
      description: "Serving patients across Rwanda 24/7",
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        {/* Main Content */}
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-8">
            About TeleMedicine Rwanda
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div data-aos="fade-up" data-aos-duration="100">
            <img
              src={providersImage}
              alt="Healthcare providers collaborating"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>

          <div data-aos="fade-up" data-aos-duration="100">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-6">
              Trusted Healthcare Partners
            </h2>
            <div className="w-16 h-1 bg-blue-900 mb-6"></div>
            
            <p className="text-blue-900/75 text-base mb-6 leading-relaxed">
              TeleMedicine Rwanda collaborates with leading healthcare providers across the nation to bring you consistent, high-quality medical care. Our network of certified doctors, hospitals, and clinics ensures that every patient receives personalized attention and expert medical guidance.
            </p>

            <p className="text-blue-900/60 text-sm mb-8 leading-relaxed">
              We believe that healthcare should be accessible, affordable, and convenient. By connecting patients with verified healthcare professionals, we're breaking down geographical barriers and making quality medical services available to every corner of Rwanda.
            </p>

            <Link to="/login">
              <Button className="rounded-full px-8 border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors">
                Register Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Why Choose Us - Highlights Section */}
        <div className="mt-16">
          <h3 className="text-2xl md:text-3xl font-semibold text-blue-900 text-center mb-4">
            Why Choose TeleMedicine Rwanda?
          </h3>
          <p className="text-blue-900/60 text-center mb-12 max-w-2xl mx-auto">
            We're committed to revolutionizing healthcare access across Rwanda through innovation, trust, and dedication to patient wellness.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                >
                  <IconComponent className="w-10 h-10 text-blue-900 mb-4" />
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-blue-900/60 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Trust Section */}
        <div className="mt-16 bg-white rounded-xl p-8 md:p-12 shadow-md">
          <h3 className="text-xl md:text-2xl font-semibold text-blue-900 mb-6">
            Our Commitment to You
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Healthcare Excellence</h4>
              <p className="text-blue-900/60 text-sm leading-relaxed">
                Every consultation is conducted by verified medical professionals with extensive experience. We maintain rigorous quality standards to ensure your health and safety.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Data Privacy & Security</h4>
              <p className="text-blue-900/60 text-sm leading-relaxed">
                Your medical records and personal information are encrypted and protected with the highest security standards. Your privacy is never compromised.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Affordable Care</h4>
              <p className="text-blue-900/60 text-sm leading-relaxed">
                We partner with insurance providers and offer flexible payment options to ensure quality healthcare is accessible to everyone in Rwanda.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">24/7 Availability</h4>
              <p className="text-blue-900/60 text-sm leading-relaxed">
                Whether it's day or night, our healthcare providers are available when you need them. Emergency and non-urgent consultations are just a click away.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        {/* <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div data-aos="zoom-in">
            <p className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">500+</p>
            <p className="text-blue-900/60">Verified Healthcare Providers</p>
          </div>
          <div data-aos="zoom-in" data-aos-delay="100">
            <p className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">10K+</p>
            <p className="text-blue-900/60">Happy Patients Served</p>
          </div>
          <div data-aos="zoom-in" data-aos-delay="200">
            <p className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">99.5%</p>
            <p className="text-blue-900/60">Customer Satisfaction Rate</p>
          </div>
        </div> */}
      </div>
    </section>
  );
};