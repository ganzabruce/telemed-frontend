import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import checkupImage from "../../../assets/medical-checkup.jpg";
export const SpecialOffer = () => {
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