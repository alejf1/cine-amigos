import { useState, useEffect } from "react";

export function useMovieSearch(titulo) {
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!titulo || titulo.length < 3) {
      setSuggestions([]);
      return;
    }

    const searchMovies = async () => {
      setSearchLoading(true);
      try {
        // ← BÚSQUEDA BILINGÜE: Dos requests paralelas
        const [esResponse, enResponse] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&language=es-ES&include_adult=false`
          ),
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&language=en-US&include_adult=false`
          )
        ]);

        const [esData, enData] = await Promise.all([
          esResponse.json(),
          enResponse.json()
        ]);

        // Combinar resultados: primero español, luego inglés (sin duplicados)
        const combined = [
          ...(esData.results || []),
          ...enData.results.filter(enMovie => 
            !esData.results.some(esMovie => 
              esMovie.title.toLowerCase() === enMovie.title.toLowerCase()
            )
          )
        ].slice(0, 5); // Top 5 total

        setSuggestions(combined);
      } catch (error) {
        console.error('Error buscando películas:', error);
        setSuggestions([]);
      }
      setSearchLoading(false);
    };

    const timeoutId = setTimeout(searchMovies, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [titulo]);

  const handleSuggestionSelect = (suggestion, setTitulo, setGenero, setAnio, setPoster) => {
    // Detectar idioma y ajustar título
    const isSpanish = suggestion.original_title?.toLowerCase() !== suggestion.title?.toLowerCase();
    const displayTitle = isSpanish ? suggestion.title : suggestion.original_title || suggestion.title;
    
    setTitulo(displayTitle);
    setGenero(suggestion.genre_ids?.map(getGenreName).join(', ') || '');
    setAnio(suggestion.release_date ? suggestion.release_date.split('-')[0] : '');
    setPoster(suggestion.poster_path ? `https://image.tmdb.org/t/p/w500${suggestion.poster_path}` : '');
    setSuggestions([]);
  };

  return {
    suggestions,
    searchLoading,
    handleSuggestionSelect
  };
}

// Helper para géneros (expandido)
function getGenreName(id) {
  const genres = {
    // Español
    28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
    99: 'Documental', 18: 'Drama', 10751: 'Familia', 14: 'Fantasía', 36: 'Historia',
    27: 'Terror', 10402: 'Música', 9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'Guerra', 37: 'Western',
    // Inglés (fallback)
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };
  return genres[id] || 'Desconocido';
}
