import React from "react";
import Link from "next/link";
import Image from "next/image";

const styles = `
  @keyframes subtleScale {
    0% { transform: scale(0.95); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .animate-entrance {
    animation: subtleScale 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  }

  /* Nouvelle animation pour le logo */
  .logo-container {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .logo-container:hover {
    transform: translateY(-2px);
    opacity: 0.9;
  }
`;

export default function NotFound() {
  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-10 font-sans text-center relative">
        <div className="space-y-8 max-w-2xl w-full animate-entrance">
          {/* Logo positionné de manière centrale avec espacement contrôlé */}
          <div className="flex justify-center mb-12"> {/* Augmentation de la marge basse */}
            <div className="logo-container bg-white p-5 rounded-full shadow-md ring-1 ring-gray-200 hover:shadow-lg transition-all"> {/* Bordure plus visible */}
              <Image
                src="/logo.svg"
                alt="Logo LNB"
                width={72} 
                height={72}
                className="rounded-full"
              />
            </div>
          </div>

          {/* Le reste du contenu reste inchangé */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Bienvenue sur <br className="md:hidden" />
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              LNB Intranet
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mt-6 max-w-xl mx-auto leading-relaxed">
            Cette section est actuellement en cours de développement.
            <span className="block mt-2 text-gray-500 text-base">
              Nous mettons tout en œuvre pour vous offrir une expérience optimale.
            </span>
          </p>

          <div className="mt-10">
            <Link
              href="/admin/"
              className="inline-flex items-center px-8 py-3.5 bg-gradient-to-br from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
            >
              <span>Retour à l&apos;accueil</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        <footer className="mt-16 text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} LNB Intranet — Tous droits réservés</p>
        </footer>
      </div>
    </>
  );
}