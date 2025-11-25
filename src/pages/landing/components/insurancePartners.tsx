import type{ InsurancePartner } from "@/api/landingApi";
import { useState,useEffect } from "react";
import { getInsurancePartners } from "@/api/landingApi";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
export const InsurancePartners = () => {
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