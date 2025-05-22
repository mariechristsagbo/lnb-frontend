"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import { BoxIcon, UserIcon as SearchIcon } from "@/icons";
import Cookies from 'js-cookie';
import { Modal } from "@/components/ui/modal/index"; // Adjusted the relative path to locate the Modal component

interface Publication {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  is_public: boolean;
  author: {
    id: number;
    name: string;
  };
}

interface Comment {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

interface PublicationDetails {
  publication: {
    titre: string;
    contenu: string;
    date: string;
    heure: string;
    auteur: string;
  };
  commentaires: Comment[];
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [filteredPublications, setFilteredPublications] = useState<Publication[]>([]);
  const [selectedPublication, setSelectedPublication] = useState<PublicationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les publications
  useEffect(() => {
    async function fetchPublications() {
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      console.log("Token d'accès trouvé. Tentative de récupération des publications...");
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/communication/view_publications/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Publications récupérées avec succès:", data.publications);
        setPublications(data.publications || []);
        setFilteredPublications(data.publications || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des publications:", error);
        setError("Impossible de charger les publications.");
      }
    }

    fetchPublications();
  }, []);

  const handleViewComments = async (publicationId: number) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    console.log(`Tentative de récupération des détails de la publication avec ID ${publicationId}...`);
    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/communication/detail_publication/${publicationId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const publicationDetails = await response.json();

      const commentsResponse = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/communication/view_publication_comments/${publicationId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!commentsResponse.ok) {
        throw new Error(`Erreur HTTP: ${commentsResponse.status}`);
      }

      const commentsData = await commentsResponse.json();

      const combinedDetails = {
        publication: {
          titre: publicationDetails.title,
          contenu: publicationDetails.content,
          date: new Date(publicationDetails.created_at).toLocaleDateString(),
          heure: new Date(publicationDetails.created_at).toLocaleTimeString(),
          auteur: publicationDetails.author.name,
        },
        commentaires: commentsData.commentaires,
      };

      setSelectedPublication(combinedDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la publication:", error);
      setError("Impossible de charger les détails de la publication.");
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = publications.filter((publication) =>
      publication.title.toLowerCase().includes(query) ||
      publication.content.toLowerCase().includes(query) ||
      publication.category.toLowerCase().includes(query)
    );
    setFilteredPublications(filtered);
  };

  const handleAddPublication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPublication = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      category: formData.get('category') as string,
    };

    const token = Cookies.get('authTokens');
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/communication/add_publication/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newPublication),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout de la publication");
      }

      const addedPublication = await response.json();
      setPublications((prevPublications) => [addedPublication, ...prevPublications]);
      setFilteredPublications((prevPublications) => [addedPublication, ...prevPublications]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la publication:", error);
      setError("Impossible d'ajouter la publication.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-4 text-white bg-red-600 rounded-md">
            {error}
          </div>
        )}

        {/* En-tête avec boutons */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Publications</h1>
          <div className="flex flex-wrap gap-3">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              <BoxIcon className="w-5 h-5" />
              Ajouter une publication
            </Button>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={handleSearch}
                className="px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
              <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
            </div>
            <Link href="/stopfollowingpublication/">
              <Button 
                variant="outline"
                className="flex items-center gap-2"
              >
                <BoxIcon className="w-5 h-5" />
                Arrêter de suivre
              </Button>
            </Link>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableCell isHeader>ID</TableCell>
                <TableCell isHeader>Titre</TableCell>
                <TableCell isHeader>Contenu</TableCell>
                <TableCell isHeader>Catégorie</TableCell>
                <TableCell isHeader>Date de création</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPublications.length > 0 ? (
                filteredPublications.map((publication) => (
                  <TableRow key={publication.id}>
                    <TableCell>{publication.id}</TableCell>
                    <TableCell>{publication.title}</TableCell>
                    <TableCell>
                      {publication.content.length > 30 ? 
                        `${publication.content.substring(0, 30)}...` : 
                        publication.content
                      }
                    </TableCell>
                    <TableCell>{publication.category}</TableCell>
                    <TableCell>{new Date(publication.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewComments(publication.id)}
                      >
                        Voir les commentaires
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <td colSpan={6} className="text-center">
                    {searchQuery ? "Aucun résultat trouvé" : "Aucune publication disponible"}
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal de détails */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          className="max-w-2xl"
        >
          {selectedPublication && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Détails de la publication</h2>
              <div className="space-y-3">
                <p><strong>Titre:</strong> {selectedPublication.publication.titre}</p>
                <p><strong>Contenu:</strong> {selectedPublication.publication.contenu}</p>
                <p><strong>Date de création:</strong> {selectedPublication.publication.date}</p>
                <p><strong>Heure de création:</strong> {selectedPublication.publication.heure}</p>
                <p><strong>Auteur:</strong> {selectedPublication.publication.auteur}</p>
                
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-3">Commentaires</h3>
                  {selectedPublication.commentaires?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedPublication.commentaires.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex justify-between">
                            <strong>{comment.author}</strong>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-2">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun commentaire.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal d'ajout */}
        <Modal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-xl"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Ajouter une publication</h2>
            <form onSubmit={handleAddPublication} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                  Contenu
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Catégorie
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Actualité">Actualité</option>
                  <option value="Événement">Événement</option>
                  <option value="Information">Information</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button variant="primary">
                  Ajouter
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  );
}