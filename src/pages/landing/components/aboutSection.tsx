import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import providersImage from "../../../assets/healthcare-providers.jpg";
export const AboutSection = () => {
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