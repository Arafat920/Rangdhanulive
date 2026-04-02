const API_KEY = '0f9ff00a0afc741ccd05fcad09b52563';
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';

const apiUrls = {
    home: [
        { title: 'Spotlight', url: `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`, type: 'all' },
        { title: 'New Releases', url: `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}`, type: 'movie' },
        { title: 'Popular Series', url: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`, type: 'tv' }
    ],
    tv: [{ title: 'Binge-Worthy Shows', url: `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`, type: 'tv' }],
    movies: [{ title: 'Blockbuster Movies', url: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`, type: 'movie' }]
};

let myWatchlist = JSON.parse(localStorage.getItem('appleWatchlist')) || [];

window.onload = () => loadPage('home');

async function loadPage(page) {
    // Navigation active state
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
                    <div id="${rowId}" class="movie-row"></div>
                </div>
            </div>`;
        fetchRowData(sec.url, rowId, sec.title === 'Spotlight', sec.type);
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
            // PC Scroll Enable
            enableHorizontalScroll(row);
        }
    });
}

function setupHero(item) {
    const hero = document.getElementById('hero');
    hero.style.backgroundImage = `url(${IMG_PATH + item.backdrop_path})`;
    document.getElementById('heroContent').innerHTML = `
        <h1>${item.title || item.name}</h1>
        <p>${item.overview.substring(0, 160)}...</p>
        <button class="btn-apple btn-fill" onclick="openDetails(${item.id}, '${item.media_type || 'movie'}')">View Now</button>
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
                <p style="margin-bottom:20px;">⭐ ${movie.vote_average.toFixed(1)} | ${movie.release_date || movie.first_air_date} | ${movie.runtime || movie.episode_run_time || '?'} min</p>
                <p class="modal-overview" style="margin-bottom:30px; font-size:16px; color:#ccc;">${movie.overview}</p>
                <button class="btn-apple btn-fill" onclick="getTrailer(${movie.id}, '${mType}')">▶ Play Trailer</button>
                <button class="btn-apple btn-border" onclick="toggleWatchlist(${JSON.stringify(movie).replace(/"/g, '&quot;')}, '${mType}')">
                    ${isAdded ? '✕ Remove List' : '+ Add List'}
                </button>
            </div>
        </div>
    `;
}

function toggleWatchlist(item, type) {
    const idx = myWatchlist.findIndex(m => m.id === item.id);
    if (idx > -1) {
        myWatchlist.splice(idx, 1);
    } else {
        item.mType = type;
        myWatchlist.push(item);
    }
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

// Advanced Voice Search Logic
const voiceBtn = document.getElementById('voiceBtn');
const recognition = window.SpeechRecognition || window.webkitSpeechRecognition ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() : null;

if (recognition) {
    recognition.onstart = () => voiceBtn.classList.add('listening');
    recognition.onend = () => voiceBtn.classList.remove('listening');
    recognition.onresult = (event) => {
        const query = event.results[0][0].transcript;
        document.getElementById('searchInput').value = query;
        performSearch(query);
    };
}

voiceBtn.onclick = () => {
    if (recognition) recognition.start();
    else alert("Voice recognition not supported in this browser.");
};

document.getElementById('searchBtn').onclick = () => performSearch(document.getElementById('searchInput').value);

async function performSearch(query) {
    if (!query) return;
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();
    const results = data.results;

    document.getElementById('searchResults').style.display = 'block';
    const grid = document.getElementById('searchGrid');
    grid.innerHTML = '';
    results.forEach(item => {
        if (item.poster_path) {
            grid.innerHTML += `<div class="movie-card"><img src="${IMG_PATH + item.poster_path}" onclick="openDetails(${item.id}, '${item.media_type}')"></div>`;
        }
    });
}

function closeSearch() { document.getElementById('searchResults').style.display = 'none'; }
function closeModal() { document.getElementById('detailModal').style.display = 'none'; }

async function getTrailer(id, type) {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === 'Trailer');
    if (trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`);
    else alert("Trailer not found!");
}

function enableHorizontalScroll(el) {
    el.addEventListener('wheel', (e) => {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
    });
}
