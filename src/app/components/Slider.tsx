'use client';

import React from "react";
import Image from "next/image"; // Importation du composant Image de Next.js

const menuItems: string[] = [
  "Annonces",
  "Documents et Ressources",
  "Applications",
  "Statistiques",
  "Communauté et Collaborations",
  "Services et Outils",
  "Multimédia",
  "Support IT et Assistance",
];

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white border-r p-4">
      <div className="mb-6">
        {/* Logo */}
        <Image
          src="/lnb-logo.png" // Remplacez par le chemin de votre logo
          alt="LNB Logo"
          className="h-12 mx-auto"
          width={100} // Définissez une largeur pour l'image
          height={50} // Définissez une hauteur pour l'image
        />
      </div>
      <nav className="flex flex-col gap-3">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="bg-green-500 text-white text-sm font-semibold py-3 px-4 rounded-md hover:bg-green-600"
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
