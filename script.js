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
                .then(response => {
                    if (!response.ok) throw new Error(`Erreur réseau : ${response.statusText}`);
                    return response.text();
                })
                .then(data => parseM3U(data))
                .catch(error => {
                    statusDiv.textContent = `Erreur : ${error.message}. Le serveur distant bloque peut-être la requête (CORS).`;
                    statusDiv.style.color = 'red';
                });
        }
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            statusDiv.textContent = 'Lecture du fichier local...';
            const reader = new FileReader();
            reader.onload = (e) => parseM3U(e.target.result);
            reader.readAsText(file);
        }
    });

    Object.keys(tabs).forEach(category => {
        tabs[category].addEventListener('click', () => showCategory(category));
    });

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

    function parseM3U(m3uContent) {
        statusDiv.textContent = 'Analyse du contenu...';
        allMedia = { films: [], series: [], chaines: [] };

        const lines = m3uContent.split('\n');
        let currentItem = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('#EXTINF:')) {
                const nameMatch = trimmedLine.match(/tvg-name="([^"]*)"/);
                const groupMatch = trimmedLine.match(/group-title="([^"]*)"/);
                const logoMatch = trimmedLine.match(/tvg-logo="([^"]*)"/);
                const fallbackName = trimmedLine.split(',').pop();
                
                currentItem = {
                    title: nameMatch ? nameMatch[1].trim() : (fallbackName || 'Titre inconnu').trim(),
                    group: groupMatch ? groupMatch[1].trim().toUpperCase() : '',
                    logo: logoMatch ? logoMatch[1] : null,
                    url: ''
                };
            } else if (currentItem && (trimmedLine.startsWith('http'))) {
                currentItem.url = trimmedLine;
                if (currentItem.group.includes('FRANCE')) {
                    allMedia.chaines.push(currentItem);
                } else if (currentItem.group.includes('SERIES')) {
                    allMedia.series.push(currentItem);
                } else if (/\(\d{4}\)/.test(currentItem.title)) {
                    allMedia.films.push(currentItem);
                }
                currentItem = null;
            }
        }
        
        statusDiv.textContent = `Analyse terminée.`;
        setupUI();
    }

    function setupUI() {
        counts.films.textContent = `(${allMedia.films.length})`;
        counts.series.textContent = `(${allMedia.series.length})`;
        counts.chaines.textContent = `(${allMedia.chaines.length})`;

        populateList(lists.films, allMedia.films);
        populateList(lists.series, allMedia.series);
        populateList(lists.chaines, allMedia.chaines);

        searchContainer.style.display = 'block';
        if (allMedia.films.length > 0) {
            showCategory('films');
        } else if (allMedia.series.length > 0) {
            showCategory('series');
        } else {
            showCategory('chaines');
        }
    }

    function populateList(listElement, items) {
        listElement.innerHTML = '';
        const placeholderLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMzAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzMyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMCIgZmlsbD0iIzU1NSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'media-item';

            const img = document.createElement('img');
            img.className = 'media-item-logo';
            img.src = item.logo || placeholderLogo;
            img.alt = item.title;
            img.onerror = () => { img.src = placeholderLogo; };

            const contentDiv = document.createElement('div');
            contentDiv.className = 'media-item-content';

            const titleP = document.createElement('p');
            titleP.className = 'title';
            titleP.textContent = item.title;

            const downloadLink = document.createElement('a');
            downloadLink.className = 'download-link';
            
            // C'est ici que nous appelons VOTRE proxy.
            const proxyBaseUrl = 'https://proxy-downloader.vercel.app/?'; 
            const params = new URLSearchParams({
                url: item.url,
                title: item.title 
            });
            downloadLink.href = proxyBaseUrl + params.toString();
            
            downloadLink.textContent = 'Télécharger';
            downloadLink.setAttribute('download', item.title); 

            contentDiv.appendChild(titleP);
            contentDiv.appendChild(downloadLink);
            
            div.appendChild(img);
            div.appendChild(contentDiv);
            listElement.appendChild(div);
        });
    }

    function showCategory(categoryToShow) {
        Object.keys(tabs).forEach(category => {
            const isActive = category === categoryToShow;
            tabs[category].classList.toggle('active', isActive);
            lists[category].classList.toggle('active', isActive);
        });
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
    }
});