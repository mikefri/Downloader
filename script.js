document.addEventListener('DOMContentLoaded', () => {
    // ... (tout le début du code reste identique) ...
    const urlInput = document.getElementById('m3u-url-input');
    const loadFromUrlBtn = document.getElementById('load-from-url-btn');
    const fileInput = document.getElementById('m3u-file-input');
    const mediaListDiv = document.getElementById('media-list');
    const statusDiv = document.getElementById('status');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');


    // ... (les fonctions loadFromUrl, loadFromFile, parseM3U restent identiques) ...
    function loadFromUrlBtn_click() { /* ... */ }
    function fileInput_change(event) { /* ... */ }
    function parseM3U(m3uContent) { /* ... */ }


    /**
     * MODIFIÉ : Affiche les médias et attache un nouvel écouteur de clic
     */
    function displayMedia(mediaItems) {
        mediaListDiv.innerHTML = '';

        for (const item of mediaItems) {
            const div = document.createElement('div');
            div.className = 'media-item';

            const titleP = document.createElement('p');
            titleP.className = 'title';
            titleP.textContent = item.title;
            div.appendChild(titleP);

            const urlP = document.createElement('p');
            urlP.className = 'url';
            urlP.textContent = `URL: ${item.url}`;
            div.appendChild(urlP);

            const downloadButton = document.createElement('button'); // On utilise un bouton
            downloadButton.className = 'download-link'; // On garde le même style
            downloadButton.textContent = 'Télécharger';

            // On attache l'événement de téléchargement au clic
            downloadButton.addEventListener('click', () => {
                statusDiv.textContent = `Tentative de téléchargement de : ${item.title}...`;
                statusDiv.style.color = 'orange';
                downloadFile(item.url, item.title);
            });

            div.appendChild(downloadButton);
            mediaListDiv.appendChild(div);
        }

        if (mediaItems.length > 0) {
            searchContainer.style.display = 'block';
        }
    }

    /**
     * NOUVEAU : Tente de télécharger un fichier via fetch et Blob.
     * @param {string} url L'URL du fichier à télécharger.
     * @param {string} filename Le nom du fichier à sauvegarder.
     */
    async function downloadFile(url, filename) {
        try {
            // 1. Tenter de récupérer le fichier. C'est ici que l'erreur CORS se produira le plus souvent.
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Le serveur a répondu avec une erreur: ${response.statusText}`);
            }

            // 2. Lire les données comme un "Blob" (un objet binaire).
            const blob = await response.blob();

            // 3. Créer une URL locale temporaire pour ce Blob.
            const blobUrl = window.URL.createObjectURL(blob);

            // 4. Créer un lien d'ancrage invisible pour déclencher le téléchargement.
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            // Essayer d'extraire l'extension du fichier original
            const extension = url.split('.').pop();
            a.download = `${filename}.${extension}` || 'download';
            document.body.appendChild(a);

            // 5. Cliquer sur le lien et le retirer.
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            a.remove();
            
            statusDiv.textContent = `Téléchargement de "${filename}" initié !`;
            statusDiv.style.color = '#03dac6';

        } catch (error) {
            console.error('Erreur de téléchargement:', error);
            statusDiv.innerHTML = `<b>Échec du téléchargement.</b> Raison : ${error.message}.<br>Ceci est probablement dû à une restriction de sécurité (CORS). <b>Utilisez le clic droit sur le lien original si possible.</b>`;
            statusDiv.style.color = 'red';
        }
    }
    
    // ... (l'écouteur d'événement pour la recherche reste identique) ...
    searchInput.addEventListener('input', () => { /* ... */ });
});