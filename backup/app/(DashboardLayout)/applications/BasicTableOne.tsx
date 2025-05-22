"use client";

import React, { useState } from "react";
import { PlusIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { Modal } from "@/components/ui/modal/index"; // Adjusted the relative path to locate the Modal component

const ApplicationsPage: React.FC = () => {
  // Données mockées pour les applications
  const mockApplications = [
    {
      id: 1,
      name: "Application 1",
      description: "Une description courte et percutante pour l'application 1.",
      image: "https://via.placeholder.com/300",
      website: "https://example.com",
    },
    {
      id: 2,
      name: "Application 2",
      description: "Une description courte et percutante pour l'application 2.",
      image: "https://via.placeholder.com/300",
      website: "https://example.com",
    },
    {
      id: 3,
      name: "Application 3",
      description: "Une description courte et percutante pour l'application 3.",
      image: "https://via.placeholder.com/300",
      website: "https://example.com",
    },
    // Ajoutez plus d'applications pour tester la pagination
    ...Array.from({ length: 20 }, (_, i) => ({
      id: i + 4,
      name: `Application ${i + 4}`,
      description: `Description de l'application ${i + 4}.`,
      image: "https://via.placeholder.com/300",
      website: "https://example.com",
    })),
  ];

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 6; // Nombre d'applications par page

  // Calcul des applications à afficher
  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = mockApplications.slice(
    indexOfFirstApplication,
    indexOfLastApplication
  );

  // Fonction pour changer de page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // État pour le formulaire d'ajout d'application
  const [newApplication, setNewApplication] = useState({
    name: "",
    description: "",
    url: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewApplication(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique pour soumettre le formulaire au backend
    console.log("Nouvelle application ajoutée:", newApplication);
    // Réinitialiser le formulaire
    setNewApplication({
      name: "",
      description: "",
      url: "",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Applications
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Ajouter une application
            </button>
          </div>

          {/* Grille des applications */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentApplications.map((app) => (
              <div
                key={app.id}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105"
              >
                {/* Image de l'application */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Image
                    src={app.image}
                    alt={app.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Contenu de la carte */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {app.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {app.description}
                  </p>
                  <a
                    href={app.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300"
                  >
                    <span>Visiter le site</span>
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            {Array.from(
              { length: Math.ceil(mockApplications.length / applicationsPerPage) },
              (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`mx-1 px-4 py-2 rounded-lg transition-colors duration-300 ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  {i + 1}
                </button>
              )
            )}
          </div>

          {/* Modal pour le formulaire d'ajout d'application */}
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            className="max-w-xl"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Ajouter une nouvelle application</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Nom de l&apos;application
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newApplication.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newApplication.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={newApplication.url}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                  >
                    Ajouter
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;