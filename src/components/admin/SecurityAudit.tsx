import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button/Button"; // Chemin corrigé
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

const SecurityAudit = () => {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Données fictives pour l'audit de sécurité
  const securityScore = 82;
  const securityIssues = [
    { id: 1, severity: "high", title: "Mots de passe faibles détectés", description: "5 utilisateurs utilisent des mots de passe trop simples", status: "open" },
    { id: 2, severity: "medium", title: "Certificat SSL proche de l'expiration", description: "Le certificat SSL expire dans 14 jours", status: "in_progress" },
    { id: 3, severity: "low", title: "Mises à jour de sécurité disponibles", description: "3 mises à jour de sécurité disponibles pour le système", status: "open" },
    { id: 4, severity: "high", title: "Tentatives d'accès non autorisées", description: "Multiples tentatives d'accès avec des identifiants incorrects", status: "in_progress" },
    { id: 5, severity: "medium", title: "Autorisations excessives", description: "Plusieurs utilisateurs ont des autorisations inutiles", status: "resolved" },
  ];

  // Données fictives pour les connexions
  const loginHistory = [
    { id: 1, user: "Jean Dupont", timestamp: "2023-03-21 14:32:45", ip: "192.168.1.45", location: "Paris, France", status: "success" },
    { id: 2, user: "Marie Martin", timestamp: "2023-03-21 12:15:20", ip: "10.0.0.15", location: "Lyon, France", status: "success" },
    { id: 3, user: "Inconnu", timestamp: "2023-03-21 08:47:12", ip: "45.67.89.12", location: "Unknown", status: "failed" },
    { id: 4, user: "Pierre Leroy", timestamp: "2023-03-20 17:55:33", ip: "192.168.1.22", location: "Paris, France", status: "success" },
    { id: 5, user: "Inconnu", timestamp: "2023-03-20 02:14:51", ip: "78.90.12.34", location: "Moscow, Russia", status: "failed" },
  ];

  // Données fictives pour les modifications d'accès
  const accessChanges = [
    { id: 1, user: "Admin", target: "Marie Martin", action: "promotion", role: "Éditeur → Administrateur", timestamp: "2023-03-20 09:15:30" },
    { id: 2, user: "Admin", target: "Lucas Moreau", action: "demotion", role: "Éditeur → Utilisateur", timestamp: "2023-03-19 15:40:22" },
    { id: 3, user: "Jean Dupont", target: "Thomas Bernard", action: "role_change", role: "Utilisateur → Éditeur", timestamp: "2023-03-18 11:32:15" },
    { id: 4, user: "Système", target: "Sophie Durand", action: "revoked", role: "Accès révoqué temporairement", timestamp: "2023-03-17 22:05:48" },
    { id: 5, user: "Admin", target: "Antoine Morel", action: "granted", role: "Accès spécial accordé", timestamp: "2023-03-16 14:22:37" },
  ];

  // Données fictives pour les paramètres de sécurité
  const securitySettings = {
    twoFactorAuth: true,
    passwordPolicy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90
    },
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    ipRestrictions: false
  };

  // Fonction pour obtenir la couleur du badge en fonction de la sévérité
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Composant Badge simplifié
  const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-2 py-1 text-xs rounded-full ${className || ""}`}>
      {children}
    </span>
  );

  // Composant Progress simplifié
  const Progress = ({ value, className }: { value: number, className?: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className={`h-2.5 rounded-full ${className || ""}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );

  // Composant Switch simplifié
  const Switch = ({ checked, onChange }: { checked?: boolean, onChange?: () => void }) => (
    <div className="relative inline-block w-12 h-6 cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={checked} 
        onChange={onChange}
      />
      <div className={`w-12 h-6 rounded-full ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
      </div>
    </div>
  );

  // Remplacements pour Select et ses composants
  const Select = ({ children, defaultValue, className }: { children: React.ReactNode, defaultValue?: string, className?: string }) => (
    <select defaultValue={defaultValue} className={`px-3 py-2 border border-gray-300 rounded-md ${className || ""}`}>
      {children}
    </select>
  );

  const _SelectTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={className}>{children}</div>
  );

  const _SelectValue = ({ placeholder }: { placeholder: string }) => (
    <span>{placeholder}</span>
  );

  const _SelectContent = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );

  const _SelectItem = ({ value, children }: { value: string, children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );

  // Composant Input simplifié
  const Input = ({ placeholder, className }: { placeholder?: string, className?: string }) => (
    <input
      type="text"
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-md ${className || ""}`}
    />
  );

  return (
    <div className="space-y-6">
      {/* Navigation entre onglets simplifiée */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`py-2 px-4 ${selectedTab === "overview" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("overview")}
        >
          Vue d&apos;ensemble
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "issues" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("issues")}
        >
          Problèmes
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "activity" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("activity")}
        >
          Activité
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "settings" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("settings")}
        >
          Paramètres
        </button>
      </div>

      {/* Contenu de l'onglet vue d'ensemble */}
      {selectedTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Score de sécurité</CardTitle>
                <CardDescription>Évaluation globale de la sécurité du système</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <svg className="w-48 h-48">
                      <circle
                        className="text-slate-200"
                        strokeWidth="12"
                        stroke="currentColor"
                        fill="transparent"
                        r="70"
                        cx="96"
                        cy="96"
                      />
                      <circle
                        className={`${
                          securityScore >= 80 ? "text-green-500" :
                          securityScore >= 60 ? "text-yellow-500" :
                          "text-red-500"
                        }`}
                        strokeWidth="12"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * securityScore) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="70"
                        cx="96"
                        cy="96"
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <p className="text-4xl font-bold">{securityScore}</p>
                      <p className="text-sm text-slate-500">sur 100</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <p className="font-medium">
                    {securityScore >= 80 ? "Bon niveau de sécurité" :
                     securityScore >= 60 ? "Niveau de sécurité acceptable" :
                     "Niveau de sécurité préoccupant"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {securityScore >= 80 ? "Votre système est bien protégé." :
                     securityScore >= 60 ? "Quelques problèmes à résoudre." :
                     "Des actions urgentes sont nécessaires."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résumé des problèmes</CardTitle>
                <CardDescription>Répartition des problèmes de sécurité par gravité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="font-medium text-red-700">Haute gravité</p>
                      <p className="font-medium text-red-700">2</p>
                    </div>
                    <Progress value={40} className="bg-red-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="font-medium text-yellow-700">Gravité moyenne</p>
                      <p className="font-medium text-yellow-700">2</p>
                    </div>
                    <Progress value={40} className="bg-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="font-medium text-blue-700">Faible gravité</p>
                      <p className="font-medium text-blue-700">1</p>
                    </div>
                    <Progress value={20} className="bg-blue-500" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                  <div>
                    <p className="font-medium">Dernier scan complet</p>
                    <p className="text-sm text-slate-500">2023-03-20 02:00</p>
                  </div>
                  <Button>Lancer un scan</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Problèmes récents</CardTitle>
              <CardDescription>Les 3 problèmes de sécurité les plus critiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityIssues.filter(issue => issue.status !== "resolved").slice(0, 3).map((issue) => (
                  <Card key={issue.id} className="overflow-hidden">
                    <div className={`h-1 ${
                      issue.severity === 'high' ? 'bg-red-500' :
                      issue.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{issue.title}</h3>
                            <Badge className={getSeverityColor(issue.severity)}>
                              {issue.severity === "high" ? "Haute" : 
                               issue.severity === "medium" ? "Moyenne" : 
                               "Faible"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{issue.description}</p>
                        </div>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status === "open" ? "Non résolu" : 
                           issue.status === "in_progress" ? "En cours" : 
                           "Résolu"}
                        </Badge>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm">Détails</Button>
                        {issue.status !== "resolved" && (
                          <Button size="sm">Résoudre</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => setSelectedTab("issues")}>Voir tous les problèmes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Contenu de l'onglet problèmes */}
      {selectedTab === "issues" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Problèmes de sécurité</CardTitle>
                <CardDescription>Liste de tous les problèmes de sécurité détectés</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all" className="w-36">
                  <option value="all">Toutes</option>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Faible</option>
                </Select>
                <Select defaultValue="all" className="w-36">
                  <option value="all">Tous</option>
                  <option value="open">Non résolus</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolus</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Gravité</TableCell>
                  <TableCell isHeader>Problème</TableCell>
                  <TableCell isHeader>Description</TableCell>
                  <TableCell isHeader>Statut</TableCell>
                  <TableCell isHeader>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity === "high" ? "Haute" : 
                         issue.severity === "medium" ? "Moyenne" : 
                         "Faible"}
                      </Badge>
                    </TableCell>
                    <TableCell>{issue.title}</TableCell>
                    <TableCell>{issue.description}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status === "open" ? "Non résolu" : 
                         issue.status === "in_progress" ? "En cours" : 
                         "Résolu"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Détails</Button>
                        {issue.status !== "resolved" && (
                          <Button size="sm">Résoudre</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Contenu de l'onglet activité */}
      {selectedTab === "activity" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique de connexion</CardTitle>
              <CardDescription>Historique des tentatives de connexion récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Utilisateur</TableCell>
                    <TableCell isHeader>Date et heure</TableCell>
                    <TableCell isHeader>Adresse IP</TableCell>
                    <TableCell isHeader>Localisation</TableCell>
                    <TableCell isHeader>Statut</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((login) => (
                    <TableRow key={login.id}>
                      <TableCell>{login.user}</TableCell>
                      <TableCell>{login.timestamp}</TableCell>
                      <TableCell>{login.ip}</TableCell>
                      <TableCell>{login.location}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(login.status)}>
                          {login.status === "success" ? "Réussie" : "Échouée"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modifications des accès</CardTitle>
              <CardDescription>Historique des modifications des droits d&apos;accès</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Administrateur</TableCell>
                    <TableCell isHeader>Utilisateur</TableCell>
                    <TableCell isHeader>Modification</TableCell>
                    <TableCell isHeader>Date et heure</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessChanges.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell>{change.user}</TableCell>
                      <TableCell>{change.target}</TableCell>
                      <TableCell>{change.role}</TableCell>
                      <TableCell>{change.timestamp}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Détails</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu de l'onglet paramètres */}
      {selectedTab === "settings" && (
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de sécurité</CardTitle>
            <CardDescription>Configuration des options de sécurité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Authentification</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Authentification à deux facteurs</p>
                      <p className="text-sm text-slate-500">Exiger l&apos;authentification à deux facteurs pour tous les utilisateurs</p>
                    </div>
                    <Switch checked={securitySettings.twoFactorAuth} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Délai d&apos;expiration de session</p>
                      <p className="text-sm text-slate-500">Déconnecter les utilisateurs après une période d&apos;inactivité</p>
                    </div>
                    <Select defaultValue={securitySettings.sessionTimeout.toString()} className="w-32">
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="60">60 min</option>
                      <option value="120">120 min</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tentatives de connexion maximales</p>
                      <p className="text-sm text-slate-500">Nombre d&apos;essais avant verrouillage du compte</p>
                    </div>
                    <Select defaultValue={securitySettings.maxLoginAttempts.toString()} className="w-32">
                      <option value="3">3</option>
                      <option value="5">5</option>
                      <option value="10">10</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Restriction d&apos;IP</p>
                      <p className="text-sm text-slate-500">Limiter l&apos;accès à des plages d&apos;IP spécifiques</p>
                    </div>
                    <Switch checked={securitySettings.ipRestrictions} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Politique de mots de passe</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Longueur minimale</p>
                      <p className="text-sm text-slate-500">Nombre minimum de caractères</p>
                    </div>
                    <Select defaultValue={securitySettings.passwordPolicy.minLength.toString()} className="w-32">
                      <option value="8">8</option>
                      <option value="10">10</option>
                      <option value="12">12</option>
                      <option value="16">16</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Caractères majuscules</p>
                      <p className="text-sm text-slate-500">Exiger au moins une lettre majuscule</p>
                    </div>
                    <Switch checked={securitySettings.passwordPolicy.requireUppercase} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Caractères minuscules</p>
                      <p className="text-sm text-slate-500">Exiger au moins une lettre minuscule</p>
                    </div>
                    <Switch checked={securitySettings.passwordPolicy.requireLowercase} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Chiffres</p>
                      <p className="text-sm text-slate-500">Exiger au moins un chiffre</p>
                    </div>
                    <Switch checked={securitySettings.passwordPolicy.requireNumbers} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Caractères spéciaux</p>
                      <p className="text-sm text-slate-500">Exiger au moins un caractère spécial</p>
                    </div>
                    <Switch checked={securitySettings.passwordPolicy.requireSpecialChars} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Expiration des mots de passe</p>
                      <p className="text-sm text-slate-500">Période avant renouvellement obligatoire</p>
                    </div>
                    <Select defaultValue={securitySettings.passwordPolicy.expiryDays.toString()} className="w-32">
                      <option value="30">30 jours</option>
                      <option value="60">60 jours</option>
                      <option value="90">90 jours</option>
                      <option value="180">180 jours</option>
                      <option value="365">1 an</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Liste blanche d&apos;IP</h3>
                <div className="border rounded-md p-4">
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">Ajouter des adresses d&apos;IP ou des plages d&apos;IP autorisées</p>
                    <div className="flex gap-2">
                      <Input placeholder="ex: 192.168.1.0/24" className="w-64" />
                      <Button variant="outline">Ajouter</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <span>192.168.1.0/24</span>
                      <Button variant="outline" size="sm" className="text-red-500">Supprimer</Button>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <span>10.0.0.0/8</span>
                      <Button variant="outline" size="sm" className="text-red-500">Supprimer</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Journalisation de sécurité</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Journalisation des connexions</p>
                      <p className="text-sm text-slate-500">Enregistrer toutes les tentatives de connexion</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Journalisation des modifications</p>
                      <p className="text-sm text-slate-500">Enregistrer toutes les modifications de données</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Conservation d&apos;historique</p>
                      <p className="text-sm text-slate-500">Durée de conservation d&apos;historique</p>
                    </div>
                    <Select defaultValue="90" className="w-32">
                      <option value="30">30 jours</option>
                      <option value="90">90 jours</option>
                      <option value="180">180 jours</option>
                      <option value="365">1 an</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline">Réinitialiser les paramètres</Button>
                <Button>Enregistrer les modifications</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityAudit;