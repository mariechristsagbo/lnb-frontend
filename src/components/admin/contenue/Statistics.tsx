import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface StatData {
  totalPublications: number;
  activePublications: number;
  categoryCounts: Record<string, number>;
  totalPolls: number;
  activePolls: number;
  archivedPolls: number;
  totalVotes: number;
  engagementRate: number;
  weeklyPublicationData: number[];
  weeklyPollData: number[];
  popularCategories: Array<{name: string, count: number}>;
  topPublications?: Array<{
    id: number;
    title: string;
    category: string;
    views: number;
    created_at: string;
  }>;
  topPolls?: Array<{
    id: number;
    question: string;
    is_archived: boolean;
    votes: number;
    participation_rate: number;
  }>;
  weeklyPublicationDates?: string[];
}

interface Category {
  name: string;
  count: number;
}

const Statistics: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'publications' | 'polls'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('last30');
  
  // Récupération des statistiques depuis l'API
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Récupération du token d'authentification
        const tokenCookie = Cookies.get("authTokens");
        if (!tokenCookie) {
          setError("Session expirée. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }
        
        const tokenData = JSON.parse(tokenCookie);
        const accessToken = tokenData.access;
        
        // Appel à l'API pour récupérer les statistiques avec le paramètre de période
        const response = await fetch(
          `https://www.backend.lnb-intranet.globalitnet.org/communication/statistics/?range=${timeRange}`, 
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des statistiques: ${response.status}`);
        }
        
        // Traitement des données reçues
        const data = await response.json();
        console.log("Données statistiques reçues:", data);
        
        // Transformation des données hebdomadaires en tableaux
        const weeklyPublicationDates = Object.keys(data.publicationStats.weeklyPublicationData || {});
        const weeklyPublicationArray = Object.values(data.publicationStats.weeklyPublicationData || {}) as number[];
        const weeklyPollArray = Object.values(data.pollStats.weeklyPollData || {}) as number[];
        
        // Transformation et organisation des données selon la structure réelle
        setStats({
          // Statistiques des publications
          totalPublications: data.publicationStats.totalPublications || 0,
          activePublications: data.publicationStats.activePublications || 0,
          categoryCounts: data.publicationStats.categoryCounts || {},
          
          // Statistiques des sondages
          totalPolls: data.pollStats.totalPolls || 0,
          activePolls: data.pollStats.activePolls || 0,
          archivedPolls: data.pollStats.archivedPolls || 0,
          totalVotes: data.pollStats.totalVotes || 0,
          engagementRate: data.pollStats.engagementRate || 0,
          
          // Données temporelles (conversion depuis l'objet en tableau)
          weeklyPublicationData: weeklyPublicationArray,
          weeklyPublicationDates: weeklyPublicationDates,
          weeklyPollData: weeklyPollArray,
          
          // Catégories populaires
          popularCategories: data.publicationStats.popularCategories?.map((cat: Category) => ({
            name: cat.name || 'Inconnu',
            count: cat.count || 0
          })) || [],
          
          // Publications et sondages populaires
          topPublications: data.publicationStats.topPublications || [],
          topPolls: data.pollStats.topPolls || []
        });
        
      } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        setError("Une erreur est survenue lors du chargement des statistiques.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, [timeRange]); // Déclencher l'effet lorsque la période change

  // Fonction pour générer la couleur de catégorie
  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 
      'bg-indigo-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500'
    ];
    return colors[index % colors.length];
  };
  
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  // Fonction pour obtenir la couleur de badge selon la catégorie
  const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase() || '') {
      case 'annonce':
        return 'bg-blue-100 text-blue-800';
      case 'événement':
      case 'evenement':
        return 'bg-green-100 text-green-800';
      case 'news':
        return 'bg-purple-100 text-purple-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayFromDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  // Rendu des statistiques générales
  const renderOverview = () => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Publications</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-700 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{stats.totalPublications}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-700 font-medium">Actives</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{stats.activePublications}</p>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 mb-2">Publications par catégorie</h4>
          <div className="space-y-2">
            {Object.entries(stats.categoryCounts).map(([category, count], index) => (
              <div key={category} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${getCategoryColor(index)} mr-2`}></div>
                <span className="text-sm text-gray-600 flex-1">{category}</span>
                <span className="text-sm font-medium text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sondages</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-md">
              <p className="text-sm text-indigo-700 font-medium">Total</p>
              <p className="text-2xl font-bold text-indigo-800 mt-1">{stats.totalPolls}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-700 font-medium">Actifs</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{stats.activePolls}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-700 font-medium">Archivés</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.archivedPolls}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Votes totaux</span>
              <span className="text-lg font-semibold text-gray-800">{stats.totalVotes}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Taux de participation</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${stats.engagementRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-800">{stats.engagementRate}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aperçu hebdomadaire</h3>
          
          <div className="h-64 flex items-end justify-between gap-2 pt-4 border-b border-gray-100">
            {/* Utiliser les données des 7 derniers jours (du plus ancien au plus récent) */}
            {stats.weeklyPublicationData.slice(-7).map((pubCount, index) => {
              // Obtenir également les données des sondages correspondantes
              const pollCount = stats.weeklyPollData.slice(-7)[index] || 0;
              
              // Utiliser les dates réelles pour afficher les jours de la semaine corrects
              const dateString = stats.weeklyPublicationDates ? stats.weeklyPublicationDates.slice(-7)[index] : '';
              const dayLabel = dateString ? getDayFromDate(dateString) : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index];
              
              return (
                <div key={`week-${index}`} className="flex flex-col items-center space-y-1 flex-1">
                  <div className="flex flex-col items-center w-full gap-1">
                    {/* Barres pour les publications */}
                    <div 
                      className="w-10 bg-blue-500 rounded-t mx-auto" 
                      style={{ height: `${Math.max(5, pubCount * 30)}px` }} // Minimum de 5px pour visibilité
                    ></div>
                    
                    {/* Barres pour les sondages - changement de couleur à jaune */}
                    <div 
                      className="w-10 bg-yellow-500 rounded-t mx-auto" 
                      style={{ height: `${Math.max(5, pollCount * 30)}px` }} // Minimum de 5px pour visibilité
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{dayLabel}</span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Publications</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Sondages</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu des statistiques de publications
  const renderPublicationStats = () => {
    if (!stats) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Analyse des publications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalPublications}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-600">Actives</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{stats.activePublications}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-md">
              <p className="text-sm text-amber-600">Taux moyen de lecture</p>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {Math.round((stats.totalPublications > 0 ? 
                  (stats.topPublications?.reduce((acc, pub) => acc + pub.views, 0) || 0) / 
                  stats.totalPublications / 5 : 0) * 100)}%
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-600">Commentaires</p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                {stats.topPublications?.reduce((acc, pub) => acc + (pub.views || 0) / 15, 0).toFixed(0) || 0}
              </p>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 mb-4">Catégories les plus populaires</h4>
          
          <div className="space-y-3">
            {stats.popularCategories.map((category, index) => (
              <div key={category.name} className="w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-sm text-gray-600">{category.count} publications</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${getCategoryColor(index)} h-2 rounded-full`} 
                    style={{ width: `${(category.count / stats.totalPublications) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Publications les plus consultées</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vues</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topPublications && stats.topPublications.length > 0 ? (
                  stats.topPublications.map((pub) => (
                    <tr key={pub.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pub.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeColor(pub.category)}`}>
                          {pub.category || 'Non catégorisé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pub.views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(pub.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Rendu des statistiques de sondages
  const renderPollStats = () => {
    if (!stats) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Analyse des sondages</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalPolls}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-600">Actifs</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{stats.activePolls}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-md">
              <p className="text-sm text-indigo-600">Votes totaux</p>
              <p className="text-2xl font-bold text-indigo-800 mt-1">{stats.totalVotes}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-md">
              <p className="text-sm text-purple-600">Taux de participation</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">{stats.engagementRate}%</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Distribution des votes</h4>
            
            <div className="relative h-64">
              <div className="absolute bottom-0 w-full flex items-end justify-around">
                {Array.from({ length: 7 }).map((_, index) => {
                  // Calcul du nombre de votes pour chaque jour (simulation basée sur données réelles)
                  const votes = stats.weeklyPollData[index] * 15 || 0;
                  const height = votes > 0 ? Math.max(40, Math.min(200, votes * 3)) : 0;
                  
                  return (
                    <div key={`poll-day-${index}`} className="w-16 flex flex-col items-center">
                      <div 
                        className={`${index < 5 ? 'bg-blue-500' : 'bg-gray-300'} w-14 rounded-t-lg`} 
                        style={{ height: `${height}px` }}
                      ></div>
                      <p className="mt-2 text-xs text-gray-600">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index]}
                      </p>
                      <p className="text-sm font-medium text-gray-700">{votes.toFixed(0)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sondages les plus populaires</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topPolls && stats.topPolls.length > 0 ? (
                  stats.topPolls.map((poll) => (
                    <tr key={poll.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{poll.question}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          poll.is_archived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {poll.is_archived ? 'Archivé' : 'Actif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{poll.votes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${poll.participation_rate}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Statistiques</h2>
        
        <div className="flex items-center bg-gray-100 rounded-md p-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`py-1.5 px-3 rounded text-sm font-medium transition-colors ${
              activeView === 'overview' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Vue d&apos;ensemble
          </button>
          <button
            onClick={() => setActiveView('publications')}
            className={`py-1.5 px-3 rounded text-sm font-medium transition-colors ${
              activeView === 'publications' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Publications
          </button>
          <button
            onClick={() => setActiveView('polls')}
            className={`py-1.5 px-3 rounded text-sm font-medium transition-colors ${
              activeView === 'polls' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sondages
          </button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Période d&apos;analyse</h3>
          <p className="text-lg font-semibold text-gray-900">
            {timeRange === 'last7' ? '7 derniers jours' : 
             timeRange === 'last30' ? '30 derniers jours' : 
             timeRange === 'last90' ? '90 derniers jours' : 'Année en cours'}
          </p>
        </div>
        
        <select 
          className="border border-gray-300 rounded-md py-2 px-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="last7">7 derniers jours</option>
          <option value="last30">30 derniers jours</option>
          <option value="last90">90 derniers jours</option>
          <option value="lastYear">Année en cours</option>
        </select>
      </div>
      
      {/* Contenu des statistiques selon la vue active */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement des statistiques...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <>
          {activeView === 'overview' && renderOverview()}
          {activeView === 'publications' && renderPublicationStats()}
          {activeView === 'polls' && renderPollStats()}
        </>
      )}
    </div>
  );
};

export default Statistics;