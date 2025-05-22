"use client";

import React from "react";
import Image from "next/image";
import { FaSearch } from "react-icons/fa"; // Icône de recherche
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "@/styles/navbar.module.css"; // CSS spécifique à la navbar

const Navbar: React.FC = () => {
  return (
    <header className={`${styles.navbar} navbar navbar-expand-lg`} style={{ backgroundColor: '#f8f9fa', height: '70px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <div className="container-fluid d-flex align-items-center justify-content-between">
        {/* Logo dans un conteneur sans lien */}
        <div className={`${styles.logoContainer} navbar-brand`} style={{ height: '60px' }}>
          <Image
            src="/images/logo.svg" // Remplacez par le chemin de votre logo
            alt="Logo"
            width={40}  // Taille réduite pour s'adapter à la hauteur de la navbar
            height={40}  // Hauteur de 40px pour correspondre à la navbar
            className={styles.logo}
          />
        </div>

        {/* Barre de recherche */}
        <div className="d-flex justify-content-center w-50">
          <input
            type="text"
            placeholder="Rechercher..."
            className="form-control" // Simplifié et propre
            style={{
              backgroundColor: '#f4f4f4',
              borderColor: '#28a745',
              borderRadius: '30px',  // Bordures arrondies
              height: '40px',  // Hauteur agrandie
              fontSize: '16px', // Taille du texte augmentée
            }}
          />
          <button className="btn btn-outline-light d-md-none" style={{ marginLeft: '5px' }}>
            <FaSearch />
          </button>
        </div>
        
        {/* Icône du compte utilisateur (partie supprimée pour l'instant) */}
        
      </div>
    </header>
  );
};

export default Navbar;
