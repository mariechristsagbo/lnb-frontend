import React, { useState } from "react";
import Image from "next/image"; // Importation de la balise Image de Next.js

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false); // État pour gérer l'ouverture du menu sur mobile

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-100 shadow-md">
      {/* Logo */}
      <div className="flex items-center justify-center w-16">
        <Image
          src="/images/logo.svg" // Remplacez par le chemin de votre logo
          alt="Logo"
          width={10}
          height={10}
        />
      </div>

      {/* Barre de recherche centré avec couleur verte */}
      <div className="relative w-full max-w-96 mx-auto">
        <input
          type="text"
          placeholder="Rechercher..."
          className="border rounded-md py-2 px-4 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      {/* Profil utilisateur */}
      <div className="flex items-center space-x-2">
        <Image
          src="/account-icon.png"
          alt="Account Icon"
          width={24}
          height={24}
          className="h-6 w-6"
        />
        <span className="text-sm font-semibold">Account</span>
      </div>

      {/* Menu mobile */}
      <div
        className={`lg:hidden absolute top-0 left-0 w-full h-full bg-white flex flex-col items-center justify-center space-y-4 transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300`}
      >
        <button className="text-gray-700 text-lg font-semibold" onClick={toggleMenu}>
          Close
        </button>
        {/* Menu mobile peut être personnalisé ici */}
      </div>
    </header>
  );
};

export default Header;
