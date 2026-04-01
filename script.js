const API_KEY = '0f9ff00a0afc741ccd05fcad09b52563';
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';

const URLs = {
    trending: `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`,
    topRated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`,
    action: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28`,
    search: `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`
};

window.onload = () => {
    fetchMovies(URLs.trending, 'trendingRow', true);
    fetchMovies(URLs.topRated, 'topRatedRow');
    fetchMovies(URLs.action, 'actionRow');
};

async function fetchMovies(url, elementId, isHero = false) {
    const res = await fetch(url);
    const data = await res.json();
    const movies = data.results;
    if (isHero) setupHero(movies[0]); 
    displayMovies(movies, elementId);
}

function setupHero(movie) {
    const hero = document.getElementById('hero');
    const heroContent = document.getElementById('heroContent');
    hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${IMG_PATH + movie.backdrop_path})`;
    heroContent.innerHTML = `
        <h1>${movie.title}</h1>
        <p>${movie.overview.substring(0, 120)}...</p>
        <button onclick="showMovieDetails(${movie.id})" style="margin-top:10px; padding:10px 20px; background:#e50914; color:white; border:none; cursor:pointer; font-weight:bold; border-radius:4px;">View Info</button>
    `;
}

function displayMovies(movies, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    movies.forEach(movie => {
        if(movie.poster_path) {
            const card = document.createElement('div');
            card.classList.add('movie-card');
            card.innerHTML = `<img src="${IMG_PATH + movie.poster_path}" alt="${movie.title}" onclick="showMovieDetails(${movie.id})">`;
            container.appendChild(card);
        }
    });
}

// মুভির বিস্তারিত পপ-আপ দেখানোর ফাংশন
async function showMovieDetails(id) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
    const movie = await res.json();
    
    const modal = document.getElementById('movieModal');
    const modalDetails = document.getElementById('modalDetails');
    
    modalDetails.innerHTML = `
        <img class="modal-poster" src="${IMG_PATH + (movie.backdrop_path || movie.poster_path)}" alt="${movie.title}">
        <div class="modal-body-content">
            <h2 class="modal-title">${movie.title}</h2>
            <div class="modal-info">
                <span>📅 ${movie.release_date}</span>
                <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                <span>⏳ ${movie.runtime} min</span>
            </div>
            <p class="modal-overview">${movie.overview}</p>
            <button onclick="getTrailer(${movie.id})" style="margin-top:20px; padding:12px 25px; background:#e50914; color:white; border:none; cursor:pointer; font-weight:bold; border-radius:4px; width:100%;">▶ Watch Trailer</button>
        </div>
    `;
    modal.style.display = 'block';
}

// পপ-আপ বন্ধ করা
document.querySelector('.close-modal').onclick = () => {
    document.getElementById('movieModal').style.display = 'none';
};

window.onclick = (event) => {
    if (event.target == document.getElementById('movieModal')) {
        document.getElementById('movieModal').style.display = 'none';
    }
};

// সার্চ ফাংশন
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value;
    if (query) {
        const res = await fetch(URLs.search + query);
        const data = await res.json();
        const main = document.getElementById('mainContent');
        const hero = document.getElementById('hero');
        const searchResults = document.getElementById('searchResults');
        main.style.display = 'none';
        hero.style.display = 'none';
        searchResults.style.display = 'grid';
        searchResults.innerHTML = '';
        data.results.forEach(movie => {
            if(movie.poster_path) {
                const card = document.createElement('div');
                card.classList.add('movie-card');
                card.innerHTML = `<img src="${IMG_PATH + movie.poster_path}" alt="${movie.title}" onclick="showMovieDetails(${movie.id})">`;
                searchResults.appendChild(card);
            }
        });
    }
});

async function getTrailer(id) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(vid => vid.type === 'Trailer');
    if(trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
    else alert("Trailer not found!");
}
