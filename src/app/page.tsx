"use client";
import React, { useState } from 'react';
import Image from 'next/image';  // Ajout de l'import
import Footer from "./components/Footer";
import NavbarComponent from './components/Navbar';
import { ButtonGroup, Button, Carousel } from 'react-bootstrap';
import { FaBullhorn } from 'react-icons/fa'; // Icône pour les annonces

interface NavbarProps {
  className?: string;
}

const _Navbar: React.FC<NavbarProps> = ({ className }) => {
  return (
    <nav className={className}>
      {/* Navbar content */}
    </nav>
  );
};

const IntranetLayout: React.FC = () => {
  const [activeButton, setActiveButton] = useState<string>('');
  const [showSidebar] = useState<boolean>(true);

  const handleButtonClick = (button: string) => {
    setActiveButton(button);
  };

  // Données des annonces (dupliquées pour l'effet de boucle)
  const announcements = [
    {
      id: 1,
      title: "Nouvelle Charte Informatique",
      content: "Consultez la nouvelle charte informatique mise à jour.",
      link: "/charte-informatique",
    },
    {
      id: 2,
      title: "Réunion d'équipe",
      content: "La prochaine réunion d'équipe aura lieu le 15 octobre.",
      link: "/reunions",
    },
    {
      id: 3,
      title: "Formation en ligne",
      content: "Inscrivez-vous à la formation sur les bonnes pratiques de sécurité.",
      link: "/formations",
    },
    // Duplique les annonces pour créer un effet de boucle
    {
      id: 4,
      title: "Nouvelle Charte Informatique",
      content: "Consultez la nouvelle charte informatique mise à jour.",
      link: "/charte-informatique",
    },
    {
      id: 5,
      title: "Réunion d'équipe",
      content: "La prochaine réunion d'équipe aura lieu le 15 octobre.",
      link: "/reunions",
    },
    {
      id: 6,
      title: "Formation en ligne",
      content: "Inscrivez-vous à la formation sur les bonnes pratiques de sécurité.",
      link: "/formations",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavbarComponent className="w-full" />

      <main className="flex flex-col lg:flex-row justify-center w-11/12 mx-auto mt-4">
        {/* Barre latérale avec annonces défilantes */}
        <nav className={`bg-white shadow-lg p-6 ${showSidebar ? 'block' : 'hidden'}`} style={{ maxWidth: '300px' }}>
          <div className="flex flex-col gap-4">
            {/* Titre avec icône */}
            <h5 className="text-gray-800 mb-4 flex items-center gap-2">
              <FaBullhorn className="text-blue-500" /> Annonces
            </h5>

            {/* Conteneur des annonces défilantes */}
            <div className="announcement-container h-96 overflow-hidden relative">
              <div className="announcement-scroll absolute top-0 w-full">
                {announcements.map((announcement) => (
                  <a
                    key={announcement.id}
                    href={announcement.link}
                    className="block no-underline mb-2" // Espacement réduit
                  >
                    {/* Carte d'annonce avec ombre verte */}
                    <div className="card bg-white border-0 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="p-4">
                        <h6 className="text-lg font-semibold text-gray-800">{announcement.title}</h6>
                        <p className="text-sm text-gray-600">{announcement.content}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Bouton "Espace Personnel" */}
            <a href="/auth/login">
              <button className="w-full bg-green-600 text-white text-left px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300">
                Espace Personnel
              </button>
            </a>
          </div>
        </nav>

        {/* Contenu principal */}
        <div className="flex flex-col justify-center items-center w-full">
          <div className="text-center w-full my-4">
            {/* Boutons de navigation */}
            <div className="flex gap-4 mb-4 justify-center w-full flex-wrap">
              <ButtonGroup className="flex flex-col sm:flex-row w-full">
                {['Charte Informatique', 'Organigramme', 'Code Ethique'].map((button, index) => (
                  <Button
                    key={index}
                    className={`btn ${activeButton === button ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} px-6 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors duration-300`}
                    onClick={() => handleButtonClick(button)}
                  >
                    {button}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            {/* Carrousel */}
            <div className="w-full" style={{ height: 'auto', overflow: 'hidden' }}>
              <Carousel style={{ width: '100%' }} interval={5000}>
                {['/images/banner1.png', '/images/banner1.png', '/images/banner1.png'].map((src, index) => (
                  <Carousel.Item key={index} style={{ width: '100%' }}>
                    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                      <Image
                        src={src}
                        alt={`Slide ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        priority={index === 0} // Prioritize loading the first image
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                      />
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Animation CSS pour le défilement des annonces (haut vers bas) */}
      <style>
        {`
          .announcement-scroll {
            animation: scrollDown 20s linear infinite;
          }

          @keyframes scrollDown {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-50%); /* Défile jusqu'à la moitié du contenu */
            }
          }

          .announcement-container:hover .announcement-scroll {
            animation-play-state: paused; /* Pause au survol */
          }
        `}
      </style>
    </div>
  );
};

export default IntranetLayout;