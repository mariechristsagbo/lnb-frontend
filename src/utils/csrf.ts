// utils/csrf.ts

// Fonction pour récupérer le token CSRF depuis les cookies
export const getCSRFToken = (): string | null => {
  if (typeof document === 'undefined') return null; // S'assurer que l'on est dans le navigateur
  
  // Récupérer tous les cookies
  const cookies = document.cookie.split(';');
  
  // Chercher un cookie qui contient le nom 'csrftoken'
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith('csrftoken=')) {
      return cookie.substring('csrftoken='.length); // Retourner la valeur du token
    }
  }
  
  return null; // Si aucun cookie 'csrftoken' n'est trouvé, retourner null
};
