"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { FaTrash } from "react-icons/fa";

// Interface pour les messages
interface Message {
  id: number;
  content: string;
  sender_id: number;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

// Interface pour les conversations
interface Conversation {
  id: number;
  title?: string;
  participants: number[]; // IDs des participants
  messages: Message[];
  unread: number;
  lastActivity: Date;
  isGroup: boolean;
}

// Interface pour les utilisateurs
interface User {
  id: number;
  username: string;
  nom: string;
  prenom: string;
}

export default function ProfessionalChatApp() {
  // ID de l'utilisateur connecté (simulé)
  const currentUserId = 1;

  // États
  const [activeTab, setActiveTab] = useState<"conversations" | "utilisateurs">("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Données fictives pour les utilisateurs
  const mockUsers: User[] = [
    { id: 1, username: "john_doe", nom: "Doe", prenom: "John" },
    { id: 2, username: "jane_smith", nom: "Smith", prenom: "Jane" },
    { id: 3, username: "alice_wonder", nom: "Wonder", prenom: "Alice" },
  ];

  // Données fictives pour les conversations
  const mockConversations: Conversation[] = [
    {
      id: 1,
      participants: [1, 2], // John Doe et Jane Smith
      messages: [
        {
          id: 1,
          content: "Salut Jane, comment vas-tu ?",
          sender_id: 1,
          timestamp: new Date(),
          status: "read",
        },
        {
          id: 2,
          content: "Je vais bien, merci John ! Et toi ?",
          sender_id: 2,
          timestamp: new Date(),
          status: "read",
        },
      ],
      unread: 0,
      lastActivity: new Date(),
      isGroup: false,
    },
    {
      id: 2,
      participants: [1, 3], // John Doe et Alice Wonder
      messages: [
        {
          id: 3,
          content: "Bonjour Alice, as-tu terminé le rapport ?",
          sender_id: 1,
          timestamp: new Date(),
          status: "delivered",
        },
      ],
      unread: 1,
      lastActivity: new Date(),
      isGroup: false,
    },
  ];

  // Simuler le chargement des conversations
  useState(() => {
    setConversations(mockConversations);
  });

  // Simuler le chargement des utilisateurs
  const users = mockUsers;

  // Renvoie le nom de l'autre participant
  const getOtherUserName = (participants: number[]): string => {
    const otherId = participants.find((id) => id !== currentUserId);
    const otherUser = users.find((u) => u.id === otherId);
    return otherUser ? `${otherUser.prenom} ${otherUser.nom}` : "Inconnu";
  };

  // Renvoie les noms des participants
  const getParticipantsNames = (participants: number[]): string => {
    return participants
      .map((id) => {
        const user = users.find((u) => u.id === id);
        return user ? `${user.prenom} ${user.nom}` : id.toString();
      })
      .join(", ");
  };

  // Envoyer un message
  const handleSendMessage = (): void => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMessageObj: Message = {
      id: Date.now(), // Simuler un ID unique
      content: newMessage,
      sender_id: currentUserId,
      timestamp: new Date(),
      status: "sent",
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation
          ? {
              ...conv,
              messages: [...conv.messages, newMessageObj],
              lastActivity: new Date(),
            }
          : conv
      )
    );

    setNewMessage("");
  };

  // Supprimer une conversation
  const handleDeleteConversation = (conversationId: number): void => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    if (selectedConversation === conversationId) {
      setSelectedConversation(null);
    }
  };

  // Démarrer une nouvelle conversation
  const handleStartConversation = (user: User): void => {
    const newConversation: Conversation = {
      id: Date.now(), // Simuler un ID unique
      participants: [currentUserId, user.id],
      messages: [],
      unread: 0,
      lastActivity: new Date(),
      isGroup: false,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setSelectedConversation(newConversation.id);
    setActiveTab("conversations");
  };

  // Filtrer les conversations
  const filteredConversations = conversations.filter((conv) =>
    (conv.title || getOtherUserName(conv.participants))
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Liste des conversations / utilisateurs */}
      <div className="w-80 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex gap-2 mb-4">
            <Button variant="primary" className="flex-1" onClick={() => setActiveTab("conversations")}>
              Conversations
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setActiveTab("utilisateurs")}>
              Utilisateurs
            </Button>
          </div>
          {activeTab === "conversations" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab === "conversations" ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedConversation === conv.id ? "bg-blue-50 dark:bg-gray-800" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${conv.isGroup ? "bg-blue-500" : "bg-green-500"}`}></div>
                    <div>
                      <h3 className="font-semibold">
                        {conv.title || getOtherUserName(conv.participants)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getParticipantsNames(conv.participants)}
                      </p>
                    </div>
                  </div>
                  {conv.unread > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                      {conv.unread}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <FaTrash />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500 flex justify-between">
                  <span className="truncate">
                    {conv.messages.length > 0
                      ? conv.messages[conv.messages.length - 1].content
                      : "Aucun message"}
                  </span>
                  <span className="text-xs opacity-75">
                    {format(conv.lastActivity, "HH:mm", { locale: fr })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartConversation(user)}
                  className="p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <h3 className="font-semibold">
                    {user.prenom} {user.nom}
                  </h3>
                  <p className="text-sm text-gray-500">{user.username}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-3">
              {conversations.find((c) => c.id === selectedConversation) && (
                <>
                  <div
                    className={`p-2 rounded-full ${
                      conversations.find((c) => c.id === selectedConversation)?.isGroup
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <div>
                    <h2 className="font-semibold">
                      {conversations.find((c) => c.id === selectedConversation)?.title ||
                        getOtherUserName(conversations.find((c) => c.id === selectedConversation)?.participants || [])}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {getParticipantsNames(conversations.find((c) => c.id === selectedConversation)?.participants || [])}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {conversations
                .find((c) => c.id === selectedConversation)
                ?.messages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-lg ${
                          isCurrentUser
                            ? "bg-blue-500 text-white"
                            : "bg-white dark:bg-gray-800 shadow-sm"
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <span className="text-xs opacity-75">
                            {format(message.timestamp, "HH:mm", { locale: fr })}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs">
                              {message.status === "sent" && "✓"}
                              {message.status === "delivered" && "✓✓"}
                              {message.status === "read" && "✓✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Écrivez un message..."
                  className="flex-1 p-2 rounded-lg border dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                />
                <Button variant="primary" onClick={handleSendMessage} className="px-4">
                  Envoyer
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Sélectionnez une conversation pour commencer
          </div>
        )}
      </div>
    </div>
  );
}