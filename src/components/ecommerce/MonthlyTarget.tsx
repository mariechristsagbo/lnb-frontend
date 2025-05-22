"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

// Définition du type pour un sondage
interface Poll {
  id: number;
  creator_id: number;
  question: string;
  options: string[];
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export default function PollsOverview() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [responseMessages, setResponseMessages] = useState<{ [id: number]: string }>({});
  const [answeredPolls, setAnsweredPolls] = useState<{ [id: number]: boolean }>({});
  const [showPollsModal, setShowPollsModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const tokenCookie = Cookies.get("authTokens");
        if (!tokenCookie) {
          setError("Utilisateur non authentifié");
          return;
        }
        const tokenData = JSON.parse(tokenCookie);
        const accessToken = tokenData.access;

        const response = await axios.get(
          "https://www.backend.lnb-intranet.globalitnet.org/communication/view_polls/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data && Array.isArray(response.data.polls)) {
          setPolls(response.data.polls);
        } else {
          setError("La structure des données pour les sondages n'est pas celle attendue.");
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response ? err.response.statusText : "Erreur Axios");
        } else {
          setError("Erreur lors de la récupération des sondages.");
        }
      }
    };

    fetchPolls();
  }, []);

  // Récupération du sondage le plus récent
  const recentPoll = polls.reduce((latest, poll) => {
    if (!latest) return poll;
    return new Date(poll.created_at) > new Date(latest.created_at) ? poll : latest;
  }, undefined as Poll | undefined);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const closeDropdown = () => setIsDropdownOpen(false);

  // Fonction de réponse pour un sondage donné
  const handleResponse = async (poll: Poll, selectedOption: string) => {
    if (answeredPolls[poll.id]) {
      setResponseMessages((prev) => ({ ...prev, [poll.id]: "Vous avez déjà répondu à ce sondage." }));
      return;
    }
    try {
      const tokenCookie = Cookies.get("authTokens");
      if (!tokenCookie) {
        setError("Utilisateur non authentifié");
        return;
      }
      const tokenData = JSON.parse(tokenCookie);
      const accessToken = tokenData.access;

      // Pour cet exemple, on utilise un user_id fixe (à remplacer par celui du profil connecté)
      const user_id = 1;

      const response = await axios.post(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/respond_to_poll/${poll.id}/`,
        {
          choice: selectedOption,
          user_id: user_id,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Réponse envoyée:", response.data);
      setResponseMessages((prev) => ({ ...prev, [poll.id]: "Votre réponse a été enregistrée avec succès." }));
      setAnsweredPolls((prev) => ({ ...prev, [poll.id]: true }));
    } catch (err: unknown) {
      console.error("Erreur lors de l'envoi de la réponse", err);
      setResponseMessages((prev) => ({ ...prev, [poll.id]: "Erreur lors de l'envoi de votre réponse." }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 relative">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
          <div>
            <h3 className="text-xl font-semibold text-white">Sondages</h3>
            <p className="mt-1 text-sm text-white">
              {polls.length} sondage{polls.length !== 1 ? "s" : ""} disponible{polls.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="relative">
            <button onClick={toggleDropdown} className="focus:outline-none">
              <MoreDotIcon className="text-white hover:text-gray-200" />
            </button>
            <Dropdown isOpen={isDropdownOpen} onClose={closeDropdown} className="w-40 p-2">
              <DropdownItem
                tag="a"
                onItemClick={() => {
                  closeDropdown();
                  setShowPollsModal(true);
                }}
                className="flex w-full text-gray-600 dark:text-gray-300 font-normal rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Voir plus
              </DropdownItem>
              <DropdownItem
                tag="a"
                onItemClick={closeDropdown}
                className="flex w-full text-gray-600 dark:text-gray-300 font-normal rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Supprimer
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="px-6 py-5">
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {recentPoll ? (
            <div>
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                Sondage le plus récent
              </h4>
              <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-base text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Question :</span> {recentPoll.question}
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentPoll.options.map((option, index) => (
                    <button
                      key={index}
                      disabled={answeredPolls[recentPoll.id]}
                      onClick={() => !answeredPolls[recentPoll.id] && handleResponse(recentPoll, option)}
                      className={`w-full border rounded-md p-3 text-sm font-medium transition ${
                        answeredPolls[recentPoll.id]
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 text-gray-800 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Créé le : {new Date(recentPoll.created_at).toLocaleString()}
                </p>
                {responseMessages[recentPoll.id] && (
                  <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">
                    {responseMessages[recentPoll.id]}
                  </p>
                )}
                {answeredPolls[recentPoll.id] && (
                  <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                    Vous avez déjà répondu à ce sondage.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">Aucun sondage disponible</p>
          )}
        </div>
      </div>

      {/* Popup affichant la liste de tous les sondages */}
      {showPollsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Fond semi-transparent */}
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowPollsModal(false)}></div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 z-10 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Liste des sondages</h3>
              <button onClick={() => setShowPollsModal(false)} className="text-gray-500 hover:text-gray-700">
                Fermer
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-6">
              {polls.map((poll) => (
                <div key={poll.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Question :</span> {poll.question}
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {poll.options.map((option, index) => (
                      <button
                        key={index}
                        disabled={answeredPolls[poll.id]}
                        onClick={() => !answeredPolls[poll.id] && handleResponse(poll, option)}
                        className={`w-full border rounded-md p-3 text-sm font-medium transition ${
                          answeredPolls[poll.id]
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "border-gray-300 text-gray-800 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Créé le : {new Date(poll.created_at).toLocaleString()}
                  </p>
                  {responseMessages[poll.id] && (
                    <p
                      className={`mt-4 text-sm font-medium ${
                        answeredPolls[poll.id]
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {responseMessages[poll.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
