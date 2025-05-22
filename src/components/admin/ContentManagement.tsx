import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button/Button"; // Chemin corrigé
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

const ContentManagement = () => {
  const [selectedTab, setSelectedTab] = useState("articles");
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Données fictives pour les articles
  const articles = [
    { id: 1, title: "Introduction à l'entreprise", author: "Jean Dupont", status: "published", category: "Entreprise", date: "2023-03-20", views: 340 },
    { id: 2, title: "Nouveaux produits 2023", author: "Marie Martin", status: "draft", category: "Produits", date: "2023-03-18", views: 0 },
    { id: 3, title: "Guide des procédures internes", author: "Pierre Leroy", status: "published", category: "Procédures", date: "2023-03-15", views: 189 },
    { id: 4, title: "Événements à venir", author: "Sophie Durand", status: "review", category: "Événements", date: "2023-03-17", views: 0 },
    { id: 5, title: "Rapport annuel 2022", author: "Jean Dupont", status: "published", category: "Rapports", date: "2023-03-10", views: 522 },
  ];

  // Données fictives pour les médias
  const medias = [
    { id: 1, name: "header_image.jpg", type: "image", size: "1.2 MB", uploadedBy: "Jean Dupont", date: "2023-03-20", usedIn: 3 },
    { id: 2, name: "product_brochure.pdf", type: "document", size: "4.5 MB", uploadedBy: "Marie Martin", date: "2023-03-18", usedIn: 1 },
    { id: 3, name: "office_tour.mp4", type: "video", size: "28.7 MB", uploadedBy: "Pierre Leroy", date: "2023-03-15", usedIn: 2 },
    { id: 4, name: "team_photo.png", type: "image", size: "3.8 MB", uploadedBy: "Sophie Durand", date: "2023-03-12", usedIn: 5 },
    { id: 5, name: "annual_report_2022.pdf", type: "document", size: "8.2 MB", uploadedBy: "Jean Dupont", date: "2023-03-10", usedIn: 2 },
  ];

  // Données fictives pour les catégories
  const categories = [
    { id: 1, name: "Entreprise", slug: "entreprise", articles: 8, description: "Informations sur l'entreprise" },
    { id: 2, name: "Produits", slug: "produits", articles: 12, description: "Informations sur les produits" },
    { id: 3, name: "Procédures", slug: "procedures", articles: 5, description: "Guides et procédures internes" },
    { id: 4, name: "Événements", slug: "evenements", articles: 7, description: "Événements passés et à venir" },
    { id: 5, name: "Rapports", slug: "rapports", articles: 9, description: "Rapports et analyses" },
  ];

  // Données fictives pour les statistiques
  const contentStats = {
    totalArticles: 41,
    publishedArticles: 32,
    draftArticles: 6,
    reviewArticles: 3,
    totalMedias: 87,
    totalSize: "267.5 MB",
    topCategories: ["Produits", "Entreprise", "Rapports"],
    popularArticles: [
      { title: "Rapport annuel 2022", views: 522 },
      { title: "Introduction à l'entreprise", views: 340 },
      { title: "Guide des procédures internes", views: 189 },
    ]
  };

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Fonction pour obtenir la couleur du badge en fonction du type de média
  const getMediaTypeBadgeColor = (type: string) => {
    switch (type) {
      case "image":
        return "bg-blue-100 text-blue-800";
      case "document":
        return "bg-purple-100 text-purple-800";
      case "video":
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

  // Données pour le graphique des vues
  const _viewsChartData = {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"],
    datasets: [
      {
        label: "Vues d'articles",
        data: [1200, 1900, 1500, 2200, 1800, 2400],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Navigation entre onglets simplifiée */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`py-2 px-4 ${selectedTab === "articles" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("articles")}
        >
          Articles
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "medias" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("medias")}
        >
          Médias
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "categories" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("categories")}
        >
          Catégories
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "statistics" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("statistics")}
        >
          Statistiques
        </button>
      </div>

      {/* Contenu de l'onglet articles */}
      {selectedTab === "articles" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Gestion des articles</CardTitle>
                <CardDescription>Gérez et modifiez vos articles</CardDescription>
              </div>
              <Button onClick={() => setShowAddContentModal(true)}>
                Nouvel article
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Rechercher un article"
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                  <option value="review">En révision</option>
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Titre</TableCell>
                  <TableCell isHeader>Auteur</TableCell>
                  <TableCell isHeader>Catégorie</TableCell>
                  <TableCell isHeader>Date</TableCell>
                  <TableCell isHeader>Statut</TableCell>
                  <TableCell isHeader>Vues</TableCell>
                  <TableCell isHeader>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>{article.title}</TableCell>
                    <TableCell>{article.author}</TableCell>
                    <TableCell>{article.category}</TableCell>
                    <TableCell>{article.date}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(article.status)}>
                        {article.status === "published" ? "Publié" : 
                         article.status === "draft" ? "Brouillon" : 
                         "En révision"}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.views}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Modifier</Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50">Supprimer</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Contenu de l'onglet médias */}
      {selectedTab === "medias" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Médiathèque</CardTitle>
                <CardDescription>Gérez vos images, documents et vidéos</CardDescription>
              </div>
              <Button onClick={() => setShowAddContentModal(true)}>
                Ajouter un média
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Rechercher un média"
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les types</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="video">Vidéos</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medias.map((media) => (
                <Card key={media.id} className="overflow-hidden">
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    {media.type === "image" ? (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    ) : media.type === "document" ? (
                      <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                        <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-red-50 flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{media.name}</h3>
                        <p className="text-sm text-slate-500">{media.size} - Utilisé dans {media.usedIn} article{media.usedIn !== 1 ? 's' : ''}</p>
                      </div>
                      <Badge className={getMediaTypeBadgeColor(media.type)}>
                        {media.type === "image" ? "Image" : 
                         media.type === "document" ? "Document" : 
                         "Vidéo"}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p>Ajouté par {media.uploadedBy} le {media.date}</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm">Détails</Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50">Supprimer</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu de l'onglet catégories */}
      {selectedTab === "categories" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Catégories de contenu</CardTitle>
                <CardDescription>Organisez votre contenu par catégories</CardDescription>
              </div>
              <Button onClick={() => setShowAddContentModal(true)}>
                Nouvelle catégorie
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Nom</TableCell>
                  <TableCell isHeader>Slug</TableCell>
                  <TableCell isHeader>Articles</TableCell>
                  <TableCell isHeader>Description</TableCell>
                  <TableCell isHeader>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>{category.articles}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Modifier</Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50">Supprimer</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Contenu de l'onglet statistiques */}
      {selectedTab === "statistics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{contentStats.totalArticles}</div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Publiés:</span>
                    <span>{contentStats.publishedArticles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Brouillons:</span>
                    <span>{contentStats.draftArticles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>En révision:</span>
                    <span>{contentStats.reviewArticles}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Médias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{contentStats.totalMedias}</div>
                <div className="mt-2 text-sm text-slate-500">Taille totale: {contentStats.totalSize}</div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Images:</span>
                    <span>53</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Documents:</span>
                    <span>28</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vidéos:</span>
                    <span>6</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Catégories</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {contentStats.topCategories.map((category, index) => (
                    <li key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <span>{category}</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {index === 0 ? '12' : index === 1 ? '8' : '9'} articles
                      </Badge>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Articles populaires</CardTitle>
              <CardDescription>Les articles les plus consultés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentStats.popularArticles.map((article, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{article.title}</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {article.views} vues
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de consultation</CardTitle>
              <CardDescription>Vues d&apos;articles sur les 6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded">
                <div className="text-center text-slate-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <p>Graphique des vues mensuelles</p>
                  <p className="text-sm">(Données de Jan à Jun 2023)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal pour ajouter du contenu (article ou média) */}
      {showAddContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedTab === "articles" ? "Nouvel article" : 
                 selectedTab === "medias" ? "Ajouter un média" : 
                 "Nouvelle catégorie"}
              </h3>
              <button 
                onClick={() => setShowAddContentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 py-4">
              {selectedTab === "articles" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium">Titre</label>
                    <input
                      id="title"
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="Titre de l'article"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium">Catégorie</label>
                    <select
                      id="category"
                      className="w-full rounded-md border border-gray-300 p-2"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium">Contenu</label>
                    <textarea
                      id="content"
                      className="w-full rounded-md border border-gray-300 p-2"
                      rows={5}
                      placeholder="Contenu de l'article"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-medium">Statut</label>
                    <select
                      id="status"
                      className="w-full rounded-md border border-gray-300 p-2"
                      defaultValue="draft"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                      <option value="review">En révision</option>
                    </select>
                  </div>
                </>
              )}
              
              {selectedTab === "medias" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="file" className="block text-sm font-medium">
                      Glissez-déposez un fichier ici, ou
                      <span className="text-blue-600">
                        {" parcourir "}
                      </span>
                    </label>
                    <p className="mt-1 text-sm text-gray-600">
                      Glissez-déposez un fichier ici, ou{" "}
                      <span className="text-blue-600">parcourir</span>
                    </p>
                    <input id="file" type="file" className="hidden" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium">Description</label>
                    <input
                      id="description"
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="Description du média"
                    />
                  </div>
                </>
              )}
              
              {selectedTab === "categories" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium">Nom</label>
                    <input
                      id="name"
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="Nom de la catégorie"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="slug" className="block text-sm font-medium">Slug</label>
                    <input
                      id="slug"
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      placeholder="slug-de-la-categorie"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium">Description</label>
                    <textarea
                      id="description"
                      className="w-full rounded-md border border-gray-300 p-2"
                      rows={3}
                      placeholder="Description de la catégorie"
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddContentModal(false)}>
                  Annuler
                </Button>
                <Button>
                  {selectedTab === "articles" ? "Créer l'article" : 
                   selectedTab === "medias" ? "Ajouter le média" : 
                   "Créer la catégorie"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;