document.addEventListener('DOMContentLoaded', () => {
    // --- Références DOM ---
    const urlInput = document.getElementById('m3u-url-input');
    const loadFromUrlBtn = document.getElementById('load-from-url-btn');
    const fileInput = document.getElementById('m3u-file-input');
    const statusDiv = document.getElementById('status');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');

    const tabs = {
        films: document.getElementById('films-tab'),
        series: document.getElementById('series-tab'),
        chaines: document.getElementById('chaines-tab'),
    };

    const lists = {
        films: document.getElementById('films-list'),
        series: document.getElementById('series-list'),
        chaines: document.getElementById('chaines-list'),
    };
    
    const counts = {
        films: document.getElementById('films-count'),
        series: document.getElementById('series-count'),
        chaines: document.getElementById('chaines-count'),
    };

    let allMedia = { films: [], series: [], chaines: [] };

    // --- Écouteurs d'événements ---
    loadFromUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            statusDiv.textContent = 'Chargement depuis l\'URL...';
            fetch(url)
                .then(response => response.ok ? response.text() : Promise.reject(response.statusText))
                .then(data => parseM3U(data))
                .catch(error => statusDiv.textContent = `Erreur : ${error}.`);
        }
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => parseM3U(e.target.result);
            reader.readAsText(file);
        }
    });

    // Clics sur les onglets
    Object.keys(tabs).forEach(category => {
        tabs[category].addEventListener('click', () => showCategory(category));
    });

    // Recherche
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const activeList = document.querySelector('.media-grid.active');
        if (!activeList) return;

        const allItems = activeList.querySelectorAll('.media-item');
        allItems.forEach(item => {
            const title = item.querySelector('.title').textContent.toLowerCase();
            item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
        });
    });

    // --- Fonctions logiques ---

    /**
     * Analyse le contenu M3U et le trie dans les catégories.
     */
    function parseM3U(m3uContent) {
        statusDiv.textContent = 'Analyse du contenu...';
        allMedia = { films: [], series: [], chaines: [] }; // Réinitialiser

        const lines = m3uContent.split('\n');
        let currentItem = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('#EXTINF:')) {
                const nameMatch = trimmedLine.match(/tvg-name="([^"]*)"/);
                const groupMatch = trimmedLine.match(/group-title="([^"]*)"/);
                const fallbackName = trimmedLine.split(',').pop();
                
                currentItem = {
                    title: nameMatch ? nameMatch[1].trim() : (fallbackName || 'Titre inconnu').trim(),
                    group: groupMatch ? groupMatch[1].trim().toUpperCase() : '',
                    url: ''
                };

            } else if (currentItem && (trimmedLine.startsWith('http'))) {
                currentItem.url = trimmedLine;

                // --- LOGIQUE DE TRI ---
                if (currentItem.group.includes('FRANCE')) {
                    allMedia.chaines.push(currentItem);
                } else if (currentItem.group.includes('SERIES')) {
                    allMedia.series.push(currentItem);
                } else if (/\(\d{4}\)/.test(currentItem.title)) { // Regex pour trouver une année (####)
                    allMedia.films.push(currentItem);
                }
                currentItem = null;
            }
        }
        
        statusDiv.textContent = `Analyse terminée.`;
        setupUI();
    }

    /**
     * Met en place l'interface après l'analyse.
     */
    function setupUI() {
        // Mettre à jour les compteurs
        counts.films.textContent = `(${allMedia.films.length})`;
        counts.series.textContent = `(${allMedia.series.length})`;
        counts.chaines.textContent = `(${allMedia.chaines.length})`;

        // Remplir les listes
        populateList(lists.films, allMedia.films);
        populateList(lists.series, allMedia.series);
        populateList(lists.chaines, allMedia.chaines);

        // Afficher la recherche et la première catégorie non vide
        searchContainer.style.display = 'block';
        if (allMedia.films.length > 0) showCategory('films');
        else if (allMedia.series.length > 0) showCategory('series');
        else showCategory('chaines');
    }

    /**
     * Remplit un élément de liste avec des médias.
     */
    function populateList(listElement, items) {
        listElement.innerHTML = ''; // Vider la liste
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'media-item';

            const titleP = document.createElement('p');
            titleP.className = 'title';
            titleP.textContent = item.title;

            const downloadLink = document.createElement('a');
            downloadLink.className = 'download-link';
            downloadLink.href = item.url;
            downloadLink.textContent = 'Télécharger';
            downloadLink.setAttribute('download', ''); 

            div.appendChild(titleP);
            div.appendChild(downloadLink);
            listElement.appendChild(div);
        });
    }

    /**
     * Affiche une catégorie et cache les autres.
     */
    function showCategory(categoryToShow) {
        Object.keys(tabs).forEach(category => {
            const isActive = category === categoryToShow;
            tabs[category].classList.toggle('active', isActive);
            lists[category].classList.toggle('active', isActive);
        });
        searchInput.value = ''; // Réinitialiser la recherche en changeant d'onglet
        searchInput.dispatchEvent(new Event('input')); // Déclencher l'événement pour afficher tous les éléments
    }
});