import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import PublicationsPage from "./PublicationsPage";
import PollsOverview from "./PollsOverview";
import Statistics from "./Statistics";

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

interface Poll {
  id: number;
  creator_id: number;
  question: string;
  options: string[];
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

const ContentManagement = () => {
  const [selectedTab, setSelectedTab] = useState("annonces");
  const [_publications, setPublications] = useState<Publication[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublications = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
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
        setPublications(data.publications || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des publications:", error);
        setError("Impossible de charger les publications.");
      }
    };

    const fetchPolls = async () => {
      try {
        const tokenCookie = Cookies.get("authTokens");
        if (!tokenCookie) {
          setError("Utilisateur non authentifié");
          return;
        }
        const tokenData = JSON.parse(tokenCookie);
        const accessToken = tokenData.access;

        const response = await fetch(
          "https://www.backend.lnb-intranet.globalitnet.org/communication/view_polls/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        setPolls(data.polls || []);
      } catch {
        setError("Erreur lors de la récupération des sondages.");
      }
    };

    fetchPublications();
    fetchPolls();
  }, []);

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Navigation entre onglets simplifiée */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`py-2 px-4 ${selectedTab === "annonces" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("annonces")}
        >
          Annonces
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "sondages" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("sondages")}
        >
          Sondages
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "statistiques" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("statistiques")}
        >
          Statistiques
        </button>
      </div>

      {/* Remplacer par l'option 1 ou 2 */}
      {/* Option 2 - PublicationsPage gère sa propre logique de données */}
      {selectedTab === "annonces" && <PublicationsPage />}

      {/* Le reste reste inchangé */}
      {selectedTab === "sondages" && (
        <PollsOverview polls={polls} />
      )}

      {selectedTab === "statistiques" && (
        <Statistics />
      )}
    </div>
  );
};

export default ContentManagement;