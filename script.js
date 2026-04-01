// আপনার নিজের TMDB API Key
const API_KEY = '0f9ff00a0afc741ccd05fcad09b52563';

// API লিঙ্কসমূহ
const SEARCH_API = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`;
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';
const POPULAR_MOVIES_API = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`;

// HTML এলিমেন্টসমূহ সিলেক্ট করা
const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// ওয়েবসাইট লোড হওয়ার সময় জনপ্রিয় মুভিগুলো দেখাবে
getMovies(POPULAR_MOVIES_API);

// মুভি ডেটা ফেচ করার ফাংশন
async function getMovies(url) {
    const res = await fetch(url);
    const data = await res.json();
    displayMovies(data.results);
}

// মুভিগুলো স্ক্রিনে দেখানোর ফাংশন
function displayMovies(movies) {
    movieGrid.innerHTML = ''; // আগের মুভিগুলো মুছে ফেলা
    
    if (movies.length === 0) {
        movieGrid.innerHTML = '<h2 style="color:red; grid-column: 1/-1;">No movies found!</h2>';
        return;
    }

    movies.forEach((movie) => {
        const { title, poster_path, vote_average, overview, id } = movie;
        
        // যদি পোস্টার না থাকে তবে একটি ডিফল্ট ইমেজ দেখানো
        const posterUrl = poster_path ? IMG_PATH + poster_path : 'https://via.placeholder.com/150x225?text=No+Image';

        const movieEl = document.createElement('div');
        movieEl.classList.add('movie-card');
        movieEl.innerHTML = `
            <img src="${posterUrl}" alt="${title}">
            <div class="movie-info">
                <h3>${title}</h3>
                <span class="rating">⭐ ${vote_average}</span>
            </div>
            <div class="movie-details">
                <p>${overview.substring(0, 100)}...</p>
                <button onclick="getTrailer(${id})" style="margin-top:10px; background:#e50914; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:5px;">Watch Trailer</button>
            </div>
        `;
        movieGrid.appendChild(movieEl);
    });
}

// সার্চ বাটনে ক্লিক করলে মুভি খোঁজা
searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value;
    if(searchTerm && searchTerm !== '') {
        getMovies(SEARCH_API + searchTerm);
        searchInput.value = ''; // সার্চ বক্স খালি করা
    } else {
        window.location.reload(); // খালি সার্চ করলে হোমপেজে ফিরে যাওয়া
    }
});

// মুভির ট্রেলার ইউটিউবে দেখানোর ফাংশন
async function getTrailer(id) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(vid => vid.type === 'Trailer');
    
    if(trailer) {
        window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
    } else {
        alert("Sorry, trailer not found!");
    }
}
