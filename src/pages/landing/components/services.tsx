import { useEffect, useState } from "react";
import "aos/dist/aos.css";
import {   Search, ShoppingBag, MessageSquare, Package, Truck, ClipboardList, Heart, Stethoscope, Phone, Video } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { type Service } from "../../../api/landingApi";
import type { LucideIcon } from "lucide-react";
import { getServices } from "../../../api/landingApi";
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

export const Services = () => {
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