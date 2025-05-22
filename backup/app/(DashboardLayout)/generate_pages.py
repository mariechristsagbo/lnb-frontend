import os

# Liste des chemins à traiter
links = [
    "/users/list",
    "/users/add",
    "/users/roles",
    "/users/permissions",
    "/users/activity",
    "/groups/list",
    "/groups/add",
    "/groups/members",
    "/groups/activity",
    "/services/list",
    "/services/add",
    "/services/history",
    "/security/sessions",
    "/security/audit",
    "/security/preferences",
    "/security/settings",
    "/documents/list",
    "/media/list",
    "/documents/versions",
    "/communication/messages",
    "/communication/publications",
    "/communication/polls",
    "/security/access-logs",
    "/security/ip-control",
    "/security/authentication",
    "/workflows/list",
    "/workflows/tasks",
    "/workflows/stats",
    "/admin/roles",
    "/admin/organization",
    "/admin/reports"
]

def create_page_file(page_path):
    try:
        # Nettoyer et découper le chemin
        path_parts = page_path.strip("/").split("/")
        
        # Créer le chemin des dossiers
        dir_path = os.path.join("src", "pages", *path_parts)
        
        # Créer les dossiers récursivement
        os.makedirs(dir_path, exist_ok=True)
        
        # Générer le nom du composant
        component_name = ''.join([part.capitalize() for part in path_parts])
        
        # Contenu du fichier React
        content = f"""import React from 'react';

const {component_name}Page = () => {{
    return (
        <div>
            <h1>Page: {page_path}</h1>
        </div>
    );
}};

export default {component_name}Page;
"""
        # Chemin complet du fichier
        file_path = os.path.join(dir_path, 'page.tsx')
        
        # Écrire le fichier
        with open(file_path, 'w') as file:
            file.write(content)
            
        print(f"✅ Créé avec succès : {file_path}")
        
    except Exception as e:
        print(f"❌ Erreur avec {page_path}: {str(e)}")

def generate_pages():
    for link in links:
        create_page_file(link)

if __name__ == "__main__":
    print("Début de la génération des pages...")
    generate_pages()
    print("Opération terminée. Vérifiez les résultats ci-dessus.")