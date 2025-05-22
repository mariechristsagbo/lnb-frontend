"use client";

import React from "react";
import styles from "@/styles/footer.module.css"; // Assurez-vous d'importer le bon fichier CSS
import Image from "next/image"; // Importation de la balise Image de Next.js

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p>Copyright Loterie Nationale du Bénin 2024</p>
        {/* Image pour l'icône de chat avec la balise Image de Next.js */}
        <div className={styles.chatIcon}>
          <Image 
            src="/images/chat.png"  // Le chemin de l'image
            alt="Chat Icon"          // Texte alternatif pour l'image
            width={30}               // Largeur de l'image
            height={30}              // Hauteur de l'image
            className={styles.chatImage} // Classe CSS
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
