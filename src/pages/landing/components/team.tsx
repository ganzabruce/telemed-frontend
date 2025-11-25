import { useState,useEffect } from "react";
import { type TeamMember } from "@/api/landingApi";
import { getTeamMembers } from "@/api/landingApi";
import { CardContent,Card } from "@/components/ui/card";
import { Linkedin,Facebook, X } from "lucide-react";
export const Team = () => {
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