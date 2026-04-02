const API_KEY = '0f9ff00a0afc741ccd05fcad09b52563';
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';

const apiUrls = {
    home: [
        { title: 'Spotlight Today', url: `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`, type: 'all' },
        { title: 'Top Rated Movies', url: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`, type: 'movie' },
        { title: 'Popular Series', url: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`, type: 'tv' }
    ],
    tv: [{ title: 'Binge-Worthy Shows', url: `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`, type: 'tv' }],
    movies: [{ title: 'Blockbuster Movies', url: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`, type: 'movie' }]
};

let myWatchlist = JSON.parse(localStorage.getItem('appleWatchlist')) || [];

window.onload = () => loadPage('home');

async function loadPage(page) {
    document.querySelectorAll('.main-nav span').forEach(s => s.classList.remove('active'));
    document.getElementById(`nav-${page}`)?.classList.add('active');

    const container = document.getElementById('rowsContainer');
    const hero = document.getElementById('hero');
    container.innerHTML = '';

    if (page === 'mylist') {
        hero.style.display = 'none';
        renderWatchlist();
        return;
    }

    hero.style.display = 'flex';
    const sections = apiUrls[page];
    for (const sec of sections) {
        const rowId = `row-${Math.random().toString(36).substr(2, 9)}`;
        container.innerHTML += `
            <div class="row-container">
                <h2>${sec.title}</h2>
                <div class="row-wrapper">
                    <button class="scroll-handle left-handle" onclick="scrollRow('${rowId}', -1)">&#10094;</button>
                    <div id="${rowId}" class="movie-row"></div>
                    <button class="scroll-handle right-handle" onclick="scrollRow('${rowId}', 1)">&#10095;</button>
                </div>
            </div>`;
        fetchRowData(sec.url, rowId, sec.title === 'Spotlight Today', sec.type);
    }
}

async function fetchRowData(url, rowId, isHero, type) {
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results;

    if (isHero) setupHero(results[0]);

    const row = document.getElementById(rowId);
    results.forEach(item => {
        if (item.poster_path) {
            const card = document.createElement('div');
            card.classList.add('movie-card');
            card.innerHTML = `<img src="${IMG_PATH + item.poster_path}" alt="poster" onclick="openDetails(${item.id}, '${item.media_type || type}')">`;
            row.appendChild(card);
        }
    });
    // মাউস হুইল দিয়ে স্ক্রল করার সুবিধা
    row.addEventListener('wheel', (e) => { e.preventDefault(); row.scrollLeft += e.deltaY; });
}

function scrollRow(rowId, direction) {
    const row = document.getElementById(rowId);
    const scrollAmount = row.clientWidth * 0.8;
    row.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function setupHero(item) {
    const hero = document.getElementById('hero');
    hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${IMG_PATH + item.backdrop_path})`;
    document.getElementById('heroContent').innerHTML = `
        <h1>${item.title || item.name}</h1>
        <p>${item.overview.substring(0, 160)}...</p>
        <button class="btn-apple btn-fill" onclick="openDetails(${item.id}, '${item.media_type || 'movie'}')">View Details</button>
    `;
}

async function openDetails(id, type) {
    const mType = type === 'tv' ? 'tv' : 'movie';
    const res = await fetch(`https://api.themoviedb.org/3/${mType}/${id}?api_key=${API_KEY}`);
    const movie = await res.json();
    const isAdded = myWatchlist.some(m => m.id === movie.id);
    const modal = document.getElementById('detailModal');
    modal.style.display = 'flex';

    document.getElementById('modalDetails').innerHTML = `
        <div class="modal-body">
            <img src="${IMG_PATH + movie.poster_path}" style="width:100%; border-radius:15px;">
            <div class="modal-info">
                <h2>${movie.title || movie.name}</h2>
                <p style="margin-bottom:20px; color:#aaa;">⭐ ${movie.vote_average.toFixed(1)} | ${movie.release_date || movie.first_air_date}</p>
                <p style="margin-bottom:30px; font-size:16px; color:#ddd; line-height:1.6;">${movie.overview}</p>
                <button class="btn-apple btn-fill" onclick="getTrailer(${movie.id}, '${mType}')">▶ Play Trailer</button>
                <button class="btn-apple btn-border" onclick="toggleWatchlist(${JSON.stringify(movie).replace(/"/g, '&quot;')}, '${mType}')">
                    ${isAdded ? '✕ Remove' : '+ My List'}
                </button>
            </div>
        </div>`;
}

function toggleWatchlist(item, type) {
    const idx = myWatchlist.findIndex(m => m.id === item.id);
    if (idx > -1) myWatchlist.splice(idx, 1);
    else { item.mType = type; myWatchlist.push(item); }
    localStorage.setItem('appleWatchlist', JSON.stringify(myWatchlist));
    closeModal();
    if(document.getElementById('nav-mylist').classList.contains('active')) renderWatchlist();
}

function renderWatchlist() {
    const container = document.getElementById('rowsContainer');
    container.innerHTML = `<div class="row-container"><h2>My Watchlist</h2><div class="search-grid"></div></div>`;
    const grid = container.querySelector('.search-grid');
    if (myWatchlist.length === 0) grid.innerHTML = '<p style="padding:20px; color:gray;">Your list is empty.</p>';
    myWatchlist.forEach(item => {
        grid.innerHTML += `<div class="movie-card"><img src="${IMG_PATH + item.poster_path}" onclick="openDetails(${item.id}, '${item.mType}')"></div>`;
    });
}

// Voice Search
const voiceBtn = document.getElementById('voiceBtn');
const recognition = (window.SpeechRecognition || window.webkitSpeechRecognition) ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() : null;
if (recognition) {
    recognition.onstart = () => voiceBtn.classList.add('listening');
    recognition.onend = () => voiceBtn.classList.remove('listening');
    recognition.onresult = (e) => { const q = e.results[0][0].transcript; document.getElementById('searchInput').value = q; performSearch(q); };
}
voiceBtn.onclick = () => recognition?.start();
document.getElementById('searchBtn').onclick = () => performSearch(document.getElementById('searchInput').value);

async function performSearch(q) {
    if (!q) return;
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${q}`);
    const data = await res.json();
    document.getElementById('searchResults').style.display = 'block';
    const grid = document.getElementById('searchGrid');
    grid.innerHTML = '';
    data.results.forEach(item => { if (item.poster_path) grid.innerHTML += `<div class="movie-card"><img src="${IMG_PATH + item.poster_path}" onclick="openDetails(${item.id}, '${item.media_type}')"></div>`; });
}

function closeSearch() { document.getElementById('searchResults').style.display = 'none'; }
function closeModal() { document.getElementById('detailModal').style.display = 'none'; }

async function getTrailer(id, type) {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const tr = data.results.find(v => v.type === 'Trailer');
    if (tr) window.open(`https://www.youtube.com/watch?v=${tr.key}`);
    else alert("Trailer not found!");
}
