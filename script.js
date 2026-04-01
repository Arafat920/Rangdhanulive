const API_KEY = '0f9ff00a0afc741ccd05fcad09b52563';
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';

// API Endpoints for Categories
const apiPaths = {
    home: [
        { title: 'Trending Movies', url: `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`, type: 'movie' },
        { title: 'Popular TV Shows', url: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`, type: 'tv' },
        { title: 'Top Rated Movies', url: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`, type: 'movie' }
    ],
    tv: [
        { title: 'Popular TV Series', url: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`, type: 'tv' },
        { title: 'Top Rated Series', url: `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`, type: 'tv' },
        { title: 'On The Air', url: `https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}`, type: 'tv' }
    ],
    movies: [
        { title: 'Now Playing', url: `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}`, type: 'movie' },
        { title: 'Popular Movies', url: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`, type: 'movie' },
        { title: 'Upcoming Movies', url: `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`, type: 'movie' }
    ],
    latest: [
        { title: 'New Arrivals', url: `https://api.themoviedb.org/3/movie/latest?api_key=${API_KEY}`, type: 'movie' },
        { title: 'Trending Today', url: `https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`, type: 'all' }
    ]
};

window.onload = () => loadContent('home');

async function loadContent(category) {
    const container = document.getElementById('rowsContainer');
    const hero = document.getElementById('hero');
    const main = document.getElementById('mainContent');
    const searchRes = document.getElementById('searchResults');
    
    container.innerHTML = '';
    searchRes.style.display = 'none';
    main.style.display = 'block';
    hero.style.display = 'flex';

    const sections = apiPaths[category];
    
    for (let i = 0; i < sections.length; i++) {
        const rowId = `row-${category}-${i}`;
        const rowHTML = `
            <div class="row-container">
                <h2>${sections[i].title}</h2>
                <div class="row-wrapper">
                    <button class="handle left-handle" onclick="scrollRow('${rowId}', -1)">&#10094;</button>
                    <div id="${rowId}" class="movie-row"></div>
                    <button class="handle right-handle" onclick="scrollRow('${rowId}', 1)">&#10095;</button>
                </div>
            </div>
        `;
        container.innerHTML += rowHTML;
        fetchData(sections[i].url, rowId, i === 0, sections[i].type);
    }
}

async function fetchData(url, rowId, isHero, type) {
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results;
    
    if (isHero) setupHero(results[0], type);
    
    const row = document.getElementById(rowId);
    results.forEach(item => {
        if (item.poster_path) {
            const card = document.createElement('div');
            card.classList.add('movie-card');
            card.innerHTML = `<img src="${IMG_PATH + item.poster_path}" alt="${item.title || item.name}" onclick="showDetails(${item.id}, '${type}')">`;
            row.appendChild(card);
        }
    });
}

function setupHero(item, type) {
    const hero = document.getElementById('hero');
    const heroContent = document.getElementById('heroContent');
    hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${IMG_PATH + item.backdrop_path})`;
    heroContent.innerHTML = `
        <h1>${item.title || item.name}</h1>
        <p>${item.overview.substring(0, 150)}...</p>
        <button onclick="showDetails(${item.id}, '${type}')" style="padding:10px 25px; background:#e50914; color:white; border:none; cursor:pointer; font-weight:bold; border-radius:4px; margin-top:15px;">View Info</button>
    `;
}

async function showDetails(id, type) {
    // TMDB uses /movie/ for movies and /tv/ for series
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}`);
    const item = await res.json();
    
    const modal = document.getElementById('movieModal');
    const details = document.getElementById('modalDetails');
    
    details.innerHTML = `
        <img class="modal-poster" src="${IMG_PATH + (item.backdrop_path || item.poster_path)}" alt="${item.title || item.name}">
        <div class="modal-body-content">
            <h2 class="modal-title">${item.title || item.name}</h2>
            <div style="margin-bottom:15px; color:#aaa; font-size:14px;">
                📅 ${item.release_date || item.first_air_date}  |  ⭐ ${item.vote_average.toFixed(1)}  |  ⏳ ${item.runtime || item.episode_run_time || '?'} min
            </div>
            <p style="color:#ddd; line-height:1.6;">${item.overview}</p>
            <button onclick="getTrailer(${item.id}, '${mediaType}')" style="margin-top:20px; padding:12px; background:#e50914; color:white; border:none; width:100%; cursor:pointer; font-weight:bold; border-radius:4px;">▶ Watch Trailer</button>
        </div>
    `;
    modal.style.display = 'block';
}

function scrollRow(id, dir) {
    const el = document.getElementById(id);
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
}

document.querySelector('.close-modal').onclick = () => document.getElementById('movieModal').style.display = 'none';

async function getTrailer(id, type) {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === 'Trailer');
    if (trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
    else alert("Trailer not found!");
}

// Search Logic
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value;
    if (query) {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}`);
        const data = await res.json();
        const searchRes = document.getElementById('searchResults');
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('hero').style.display = 'none';
        searchRes.style.display = 'grid';
        searchRes.innerHTML = '';
        data.results.forEach(item => {
            if (item.poster_path) {
                const card = document.createElement('div');
                card.classList.add('movie-card');
                card.innerHTML = `<img src="${IMG_PATH + item.poster_path}" alt="${item.title || item.name}" onclick="showDetails(${item.id}, '${item.media_type}')">`;
                searchRes.appendChild(card);
            }
        });
    }
});
