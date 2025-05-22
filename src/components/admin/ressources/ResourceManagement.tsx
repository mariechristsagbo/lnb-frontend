import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";

// Types pour les données de l'API
interface StorageStats {
  overview: {
    totalFiles: number;
    totalStorage: number;
    averageFileSize: number;
    filesByType: {
      documents: number;
      media: number;
    };
    storageByType: {
      documents: number;
      media: number;
    };
  };
  documents: {
    count: number;
    totalSize: number;
    averageSize: number;
    largestFiles: LargeFile[];
    fileTypes: Record<string, number>;
  };
  media: {
    count: number;
    totalSize: number;
    averageSize: number;
    byMediaType: Record<string, number>;
    largestFiles: LargeFile[];
  };
  recentActivity: {
    recentUploads: RecentUpload[];
    uploadTrends: Record<string, { documents: number; media: number }>;
  };
}

interface LargeFile {
  name: string;
  size: number;
  type: string;
  uploaded_by: string;
  upload_date: string;
}

interface RecentUpload {
  name: string;
  size: number;
  type: string;
  uploaded_by: string;
  upload_date: string;
}

interface SystemMetric {
  metric: string;
  value: string;
  status: "normal" | "warning" | "critical";
  icon: string;
}

const StorageOverview: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  // Préfixage des variables non utilisées
  const [_filterType, _setFilterType] = useState<string>("all");
  
  // Renommer la fonction non utilisée
  const _formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Convertir les octets en format lisible
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Récupérer les statistiques depuis l'API
  useEffect(() => {
    const fetchStorageStats = async () => {
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
        
        // Appel à l'API pour récupérer les statistiques
        const response = await fetch(
          "https://www.backend.lnb-intranet.globalitnet.org/documents/statistics/storage/", 
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
        
        const data = await response.json();
        console.log("Données de stockage reçues:", data);
        
        setStats(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        setError("Une erreur est survenue lors du chargement des statistiques.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStorageStats();
  }, []);

  // Préparer les métriques système basées sur les statistiques
  const prepareSystemMetrics = (): SystemMetric[] => {
    if (!stats) return [];
    
    const totalStorage = stats.overview.totalStorage;
    // Supposons un espace total disponible fictif
    const totalAvailableStorage = 10 * 1024 * 1024 * 1024; // 10 GB
    
    const storagePercentage = totalStorage / totalAvailableStorage * 100;
    let storageStatus: "normal" | "warning" | "critical" = "normal";
    
    if (storagePercentage > 80) {
      storageStatus = "critical";
    } else if (storagePercentage > 60) {
      storageStatus = "warning";
    }
    
    return [
      { 
        metric: "Espace utilisé", 
        value: `${formatBytes(totalStorage)} / ${formatBytes(totalAvailableStorage)}`, 
        status: storageStatus,
        icon: "📊" 
      },
      { 
        metric: "Fichiers totaux", 
        value: stats.overview.totalFiles.toString(), 
        status: "normal",
        icon: "📁" 
      },
      { 
        metric: "Taille moyenne", 
        value: formatBytes(stats.overview.averageFileSize),
        status: "normal",
        icon: "📏" 
      }
    ];
  };

  // Préparer la liste des fichiers les plus volumineux
  const prepareLargestFiles = () => {
    if (!stats) return [];
    
    const largeDocuments = stats.documents.largestFiles || [];
    const largeMedia = stats.media.largestFiles || [];
    
    // Fusionner et trier par taille
    const files = [...largeDocuments, ...largeMedia]
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
    
    // Filtrer par type si nécessaire
    if (_filterType !== "all") {
      return files.filter(file => file.type.toLowerCase().includes(_filterType));
    }
    
    return files;
  };

  // Rendu du composant
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600 text-lg font-medium">Aucune statistique disponible</p>
      </div>
    );
  }

  const systemMetrics = prepareSystemMetrics();
  const largestFiles = prepareLargestFiles();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Stockage</h1>
      </div>

      {/* Métriques essentielles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {systemMetrics.map((item, index) => (
          <Card key={index} className="overflow-hidden shadow-sm">
            <div className={`h-1 w-full ${
              item.status === "normal" 
                ? "bg-green-500" 
                : item.status === "warning" 
                  ? "bg-yellow-500" 
                  : "bg-red-500"
            }`}></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{item.metric}</p>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  item.status === "normal" 
                    ? "bg-green-100" 
                    : item.status === "warning" 
                      ? "bg-yellow-100" 
                      : "bg-red-100"
                }`}>
                  <span className="text-xl">{item.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Répartition du stockage */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Répartition du stockage</CardTitle>
          <CardDescription>Espace utilisé par type de fichier</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center bg-blue-50">
                <div className="text-center">
                  <div className="text-xl font-bold">{formatBytes(stats.documents.totalSize)}</div>
                  <div className="text-sm text-gray-500">Documents</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-8 border-purple-500 flex items-center justify-center bg-purple-50">
                <div className="text-center">
                  <div className="text-xl font-bold">{formatBytes(stats.media.totalSize)}</div>
                  <div className="text-sm text-gray-500">Médias</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fichiers les plus volumineux */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Fichiers les plus volumineux</CardTitle>
          <CardDescription>Les fichiers occupant le plus d&apos;espace de stockage</CardDescription>
        </CardHeader>
        <CardContent>
          {largestFiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-medium">Nom du fichier</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Taille</TableCell>
                  <TableCell>Ajouté par</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {largestFiles.map((file, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium truncate max-w-[200px]">
                      {file.name}
                    </TableCell>
                    <TableCell>
                      <div className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        {file.type}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatBytes(file.size)}</TableCell>
                    <TableCell>{file.uploaded_by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun fichier disponible</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageOverview;