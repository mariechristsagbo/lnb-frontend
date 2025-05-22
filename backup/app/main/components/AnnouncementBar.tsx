import React, { useEffect, useState } from 'react';

const announcements = [
  "Nouvelle mise à jour disponible !",
  "Réunion d'équipe demain à 10h.",
  "Pensez à consulter la charte informatique.",
  "Bienvenue sur l'intranet LNB !",
];

const AnnouncementBar: React.FC = () => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 5000); // Change d'annonce toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-16 overflow-hidden relative bg-gray-100 rounded-lg mt-4">
      <div
        className="absolute bottom-0 w-full animate-scrollUp"
        style={{ animationDuration: '10s' }}
      >
        {announcements.map((announcement, index) => (
          <div
            key={index}
            className={`w-full p-3 text-center text-gray-800 transition-opacity duration-500 ${
              index === currentAnnouncement ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {announcement}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;