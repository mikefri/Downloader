document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes et références DOM ---
    const DOM = {
        urlInput: document.getElementById('m3u-url-input'),
        loadFromUrlBtn: document.getElementById('load-from-url-btn'),
        fileInput: document.getElementById('m3u-file-input'),
        statusDiv: document.getElementById('status'),
        searchContainer: document.getElementById('search-container'),
        searchInput: document.getElementById('search-input'),
        tabs: {
            films: document.getElementById('films-tab'),
            series: document.getElementById('series-tab'),
            chaines: document.getElementById('chaines-tab'),
        },
        lists: {
            films: document.getElementById('films-list'),
            series: document.getElementById('series-list'),
            chaines: document.getElementById('chaines-list'),
        },
        counts: {
            films: document.getElementById('films-count'),
            series: document.getElementById('series-count'),
            chaines: document.getElementById('chaines-count'),
        }
    };

    const PROXY_URL = 'https://proxy-downloader.vercel.app/api/';
    const PLACEHOLDER_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMzAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMCIgZmlsbD0iIzU1NSI+Pas d\'image</tZXh0Pjwvc3ZnPg==';

    let allMedia = { films: [], series: [], chaines: [] };
    let activeCategory = 'films';

    // --- Fonctions d'aide ---
    const updateStatus = (message, isError = false) => {
        DOM.statusDiv.textContent = message;
        DOM.statusDiv.style.color = isError ? '#ff6b6b' : '#ffffff';
    };

    // --- Logique principale ---

    /**
     * Analyse le contenu M3U et classe les médias.
     * @param {string} m3uContent Le contenu brut du fichier M3U.
     */
    const parseM3U = (m3uContent) => {
        updateStatus('Analyse du contenu...');
        allMedia = { films: [], series: [], chaines: [] };
        const lines = m3uContent.split('\n');
        let currentItem = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('#EXTINF:')) {
                const titleMatch = trimmedLine.match(/tvg-name="([^"]*)"/);
                const groupMatch = trimmedLine.match(/group-title="([^"]*)"/);
                const logoMatch = trimmedLine.match(/tvg-logo="([^"]*)"/);
                const fallbackTitle = trimmedLine.split(',').pop() || '';

                currentItem = {
                    title: (titleMatch ? titleMatch[1] : fallbackTitle).trim(),
                    group: (groupMatch ? groupMatch[1] : '').trim().toUpperCase(),
                    logo: logoMatch ? logoMatch[1] : null,
                    url: ''
                };
            } else if (currentItem && trimmedLine.startsWith('http')) {
                currentItem.url = trimmedLine;

                // Logique de classification
                if (currentItem.group.includes('SERIES') || currentItem.group.includes('SÉRIES')) {
                    allMedia.series.push(currentItem);
                } else if (currentItem.group.includes('FILM')) {
                    allMedia.films.push(currentItem);
                } else if (currentItem.group.includes('CHAINE') || currentItem.group.includes('TV')) {
                    allMedia.chaines.push(currentItem);
                } else {
                    if (/\sS\d+E\d+/i.test(currentItem.title)) {
                        allMedia.series.push(currentItem);
                    } else if (/\(\d{4}\)/.test(currentItem.title)) {
                        allMedia.films.push(currentItem);
                    } else {
                        allMedia.chaines.push(currentItem);
                    }
                }
                currentItem = null;
            }
        }

        const totalItems = allMedia.films.length + allMedia.series.length + allMedia.chaines.length;
        if (totalItems === 0) {
            updateStatus('Aucun média valide trouvé dans le fichier. Vérifiez son format.', true);
            return;
        }

        updateStatus(`Analyse terminée : ${totalItems} média(s) trouvé(s).`);
        setupUI();
    };

    /**
     * Met en place l'interface utilisateur après l'analyse.
     */
    const setupUI = () => {
        Object.keys(DOM.counts).forEach(category => {
            DOM.counts[category].textContent = `(${allMedia[category].length})`;
        });

        DOM.searchContainer.style.display = 'block';
        Object.values(DOM.tabs).forEach(tab => tab.style.display = 'inline-block');
        
        const firstNotEmptyCategory = ['films', 'series', 'chaines'].find(cat => allMedia[cat].length > 0) || 'films';
        showCategory(firstNotEmptyCategory);
        filterAndDisplayMedia();
    };

    /**
     * Filtre et affiche les médias en fonction de la recherche et de la catégorie active.
     */
    const filterAndDisplayMedia = () => {
        const searchTerm = DOM.searchInput.value.toLowerCase().trim();
        const itemsToDisplay = allMedia[activeCategory].filter(item =>
            item.title.toLowerCase().includes(searchTerm)
        );
        populateList(DOM.lists[activeCategory], itemsToDisplay);
    };

    /**
     * Remplit une grille avec les éléments médias.
     * @param {HTMLElement} listElement L'élément de la grille à remplir.
     * @param {Array<Object>} items Les objets médias à afficher.
     */
    const populateList = (listElement, items) => {
        listElement.innerHTML = '';
        if (items.length === 0) {
            listElement.innerHTML = '<p class="empty-message">Aucun résultat.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'media-item';

            const img = document.createElement('img');
            img.className = 'media-item-logo';
            img.src = item.logo || PLACEHOLDER_LOGO;
            img.alt = `Logo de ${item.title}`;
            img.loading = 'lazy';
            img.onerror = () => { img.src = PLACEHOLDER_LOGO; };

            const contentDiv = document.createElement('div');
            contentDiv.className = 'media-item-content';

            const titleP = document.createElement('p');
            titleP.className = 'title';
            titleP.textContent = item.title;
            
            contentDiv.appendChild(titleP);

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            const proxyDownloadLink = document.createElement('a');
            proxyDownloadLink.className = 'download-link';
            const params = new URLSearchParams({ url: item.url, title: item.title });
            proxyDownloadLink.href = PROXY_URL + params.toString();
            proxyDownloadLink.textContent = 'Télécharger (Proxy)';
            proxyDownloadLink.setAttribute('download', item.title);

            const directDownloadLink = document.createElement('a');
            directDownloadLink.className = 'download-link';
            directDownloadLink.href = item.url;
            directDownloadLink.textContent = 'Télécharger (Direct)';
            directDownloadLink.title = "Faites un clic droit et choisissez 'Enregistrer le lien sous...'";
            directDownloadLink.setAttribute('download', item.title);
            directDownloadLink.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Pour ce bouton, faites un clic droit et sélectionnez 'Enregistrer le lien sous...'.");
            });

            buttonContainer.appendChild(proxyDownloadLink);
            buttonContainer.appendChild(directDownloadLink);
            contentDiv.appendChild(buttonContainer);

            div.appendChild(img);
            div.appendChild(contentDiv);
            fragment.appendChild(div);
        });
        listElement.appendChild(fragment);
    };

    /**
     * Affiche une catégorie spécifique et masque les autres.
     * @param {string} categoryToShow La catégorie à afficher ('films', 'series', 'chaines').
     */
    const showCategory = (categoryToShow) => {
        activeCategory = categoryToShow;
        Object.keys(DOM.tabs).forEach(cat => {
            const isActive = cat === categoryToShow;
            DOM.tabs[cat].classList.toggle('active', isActive);
            DOM.lists[cat].classList.toggle('active', isActive);
        });
        DOM.searchInput.value = '';
        filterAndDisplayMedia();
    };

    // --- Écouteurs d'événements ---
    DOM.loadFromUrlBtn.addEventListener('click', () => {
        const url = DOM.urlInput.value.trim();
        if (url) {
            updateStatus('Chargement depuis l\'URL...');
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`Erreur réseau : ${response.statusText}`);
                    return response.text();
                })
                .then(data => parseM3U(data))
                .catch(error => {
                    updateStatus(`Erreur : ${error.message}. Vérifiez le lien ou la politique CORS du serveur.`, true);
                });
        } else {
            updateStatus('Veuillez entrer une URL valide.', true);
        }
    });

    DOM.fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            updateStatus('Lecture du fichier local...');
            const reader = new FileReader();
            reader.onload = (e) => parseM3U(e.target.result);
            reader.onerror = () => updateStatus('Erreur lors de la lecture du fichier.', true);
            reader.readAsText(file);
        }
    });

    Object.keys(DOM.tabs).forEach(category => {
        DOM.tabs[category].addEventListener('click', () => showCategory(category));
    });

    DOM.searchInput.addEventListener('input', filterAndDisplayMedia);
});