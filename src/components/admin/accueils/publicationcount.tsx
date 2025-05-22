"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import ChartTab from "../../common/ChartTab";
import { FaComment, FaExclamationCircle } from "react-icons/fa";

interface Publication {
  id: number;
  author_id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_archived: boolean;
}

interface DetailedPublication {
  titre: string;
  contenu: string;
  date: string;
  heure: string;
  auteur: string;
}

interface Comment {
  contenu: string;
}

export default function AnnoncesList() {
  const [annonces, setAnnonces] = useState<Publication[]>([]);
  const [selectedAnnonce, setSelectedAnnonce] = useState<DetailedPublication | null>(null);
  const [commentaires, setCommentaires] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnonces = async () => {
      try {
        const tokenCookie = Cookies.get("authTokens");
        if (!tokenCookie) {
          setError("Utilisateur non authentifié");
          return;
        }
        const tokenData = JSON.parse(tokenCookie);
        const accessToken = tokenData.access;

        const response = await axios.get(
          "https://www.backend.lnb-intranet.globalitnet.org/communication/view_publications/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        setAnnonces(response.data.publications);
      } catch (err) {
        console.error("Erreur lors de la récupération des annonces", err);
        setError("Erreur lors de la récupération des annonces");
      }
    };
    fetchAnnonces();
  }, []);

  const fetchCommentaires = async (id: number) => {
    try {
      const tokenCookie = Cookies.get("authTokens");
      if (!tokenCookie) {
        setError("Utilisateur non authentifié");
        return;
      }
      const tokenData = JSON.parse(tokenCookie);
      const accessToken = tokenData.access;

      const response = await axios.get(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/view_publication_comments/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data as { publication: DetailedPublication; commentaires: Comment[] };
      setSelectedAnnonce(data.publication);
      setCommentaires(data.commentaires);
    } catch (err) {
      console.error("Erreur lors de la récupération des commentaires", err);
      setError("Erreur lors de la récupération des commentaires");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            Annonces
          </h3>
          <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
            Découvrez les publications récentes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ChartTab />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-red-700 dark:bg-red-900">
          <FaExclamationCircle className="text-lg" /> {error}
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {annonces.map((annonce) => (
            <li
              key={annonce.id}
              className="p-4 cursor-pointer transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => fetchCommentaires(annonce.id)}
            >
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
                {annonce.title}
              </h4>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{annonce.content}</p>
            </li>
          ))}
        </ul>
      </div>

      {selectedAnnonce && (
        <div className="mt-8 rounded-lg border p-6 bg-gray-50 dark:bg-gray-800">
          <h4 className="text-2xl font-bold text-gray-800 dark:text-white">
            {selectedAnnonce.titre}
          </h4>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{selectedAnnonce.contenu}</p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Auteur: {selectedAnnonce.auteur}</p>
            <p>
              Publié le: {selectedAnnonce.date} à {selectedAnnonce.heure}
            </p>
          </div>
          <h5 className="mt-6 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
            <FaComment /> Commentaires
          </h5>
          <ul className="mt-3 space-y-2">
            {commentaires.length > 0 ? (
              commentaires.map((comment, index) => (
                <li
                  key={index}
                  className="rounded-md bg-white p-3 shadow-sm dark:bg-gray-700"
                >
                  {comment.contenu}
                </li>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Aucun commentaire</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
