document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('m3u-url-input');
    const loadFromUrlBtn = document.getElementById('load-from-url-btn');
    const fileInput = document.getElementById('m3u-file-input');
    const mediaListDiv = document.getElementById('media-list');
    const statusDiv = document.getElementById('status');
    
    // AJOUT : Références pour la recherche
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');

    // Gérer le clic sur le bouton "Charger"
    loadFromUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            statusDiv.textContent = 'Chargement depuis l\'URL...';
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`Erreur réseau : ${response.statusText}`);
                    return response.text();
                })
                .then(data => parseM3U(data))
                .catch(error => {
                    statusDiv.textContent = `Erreur : ${error.message}. Le serveur distant bloque peut-être la requête (CORS).`;
                    statusDiv.style.color = 'red';
                });
        } else {
            statusDiv.textContent = 'Veuillez entrer une URL valide.';
            statusDiv.style.color = 'orange';
        }
    });

    // Gérer la sélection d'un fichier local
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            statusDiv.textContent = 'Lecture du fichier local...';
            const reader = new FileReader();
            reader.onload = (e) => parseM3U(e.target.result);
            reader.readAsText(file);
        }
    });

    /**
     * Analyse le contenu M3U.
     * @param {string} m3uContent Le contenu brut du fichier M3U.
     */
    function parseM3U(m3uContent) {
        mediaListDiv.innerHTML = '';
        searchContainer.style.display = 'none'; // Cacher la recherche pendant l'analyse
        statusDiv.textContent = 'Analyse du contenu...';

        const lines = m3uContent.split('\n');
        const mediaItems = [];
        let currentItem = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('#EXTINF:')) {
                const nameMatch = trimmedLine.match(/tvg-name="([^"]*)"/);
                const fallbackName = trimmedLine.split(',').pop();
                currentItem = {
                    title: nameMatch ? nameMatch[1] : (fallbackName || 'Titre inconnu'),
                    url: ''
                };
            } else if (currentItem && (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://'))) {
                currentItem.url = trimmedLine;
                mediaItems.push(currentItem);
                currentItem = null;
            }
        }
        
        if (mediaItems.length > 0) {
            statusDiv.textContent = `${mediaItems.length} média(s) trouvé(s).`;
            statusDiv.style.color = '#03dac6';
            displayMedia(mediaItems);
        } else {
            statusDiv.textContent = 'Aucun média valide trouvé dans le fichier.';
            statusDiv.style.color = 'orange';
        }
    }

    /**
     * Affiche les médias trouvés et active la barre de recherche.
     * @param {Array<{title: string, url: string}>} mediaItems 
     */
    function displayMedia(mediaItems) {
        // Vider la liste avant de la remplir
        mediaListDiv.innerHTML = '';

        for (const item of mediaItems) {
            const div = document.createElement('div');
            div.className = 'media-item';

            const titleP = document.createElement('p');
            titleP.className = 'title';
            titleP.textContent = item.title;

            const urlP = document.createElement('p');
            urlP.className = 'url';
            urlP.textContent = `URL: ${item.url}`;

            const downloadLink = document.createElement('a');
            downloadLink.className = 'download-link';
            downloadLink.href = item.url;
            downloadLink.textContent = 'Télécharger';
            downloadLink.setAttribute('download', ''); 

            div.appendChild(titleP);
            div.appendChild(urlP);
            div.appendChild(downloadLink);
            
            mediaListDiv.appendChild(div);
        }

        // AJOUT : Afficher la barre de recherche s'il y a des résultats
        if(mediaItems.length > 0) {
            searchContainer.style.display = 'block';
        }
    }

    // AJOUT : Écouteur d'événement pour la recherche en temps réel
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const allItems = document.querySelectorAll('.media-item');

        allItems.forEach(item => {
            const title = item.querySelector('.title').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                item.style.display = 'flex'; // Afficher l'élément
            } else {
                item.style.display = 'none'; // Cacher l'élément
            }
        });
    });
});