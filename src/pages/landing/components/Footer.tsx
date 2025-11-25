import { Facebook,Linkedin } from "lucide-react";
export const Footer = () => {
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