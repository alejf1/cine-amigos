import { useState, useEffect } from "react";

export function useMovieSearch(titulo, isSelecting = false) {
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    // Solo buscar si NO está seleccionando
    if (!titulo || titulo.length < 3 || isSelecting) {
      if (!isSelecting) setSuggestions([]);
      return;
    }

    const searchMovies = async () => {
      setSearchLoading(true);
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        
        if (!apiKey) {
          console.error('❌ TMDB API Key no configurada. Revisa tu .env');
          setSearchLoading(false);
          return;
        }

        const [esResponse, enResponse] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(titulo)}&language=es-ES&include_adult=false`
          ),
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(titulo)}&language=en-US&include_adult=false`
          )
        ]);

        const [esData, enData] = await Promise.all([
          esResponse.json(),
          enResponse.json()
        ]);

        const combined = [
          ...(esData.results || []),
          ...enData.results.filter(enMovie => 
            !esData.results.some(esMovie => 
              esMovie.title.toLowerCase() === enMovie.title.toLowerCase()
            )
          )
        ].slice(0, 5);

        setSuggestions(combined);
      } catch (error) {
        console.error('Error buscando películas:', error);
        setSuggestions([]);
      }
      setSearchLoading(false);
    };

    const timeoutId = setTimeout(searchMovies, 300);
    return () => clearTimeout(timeoutId);
  }, [titulo, isSelecting]);

  const handleSuggestionSelect = (suggestion, setTitulo, setGenero, setAnio, setPoster, setIsSelecting) => {
    // Detectar idioma y ajustar título
    const isSpanish = suggestion.original_title?.toLowerCase() !== suggestion.title?.toLowerCase();
    const displayTitle = isSpanish ? suggestion.title : suggestion.original_title || suggestion.title;
    
    // Pausar búsqueda mientras se selecciona
    setIsSelecting(true);
    
    setTitulo(displayTitle);
    setGenero(suggestion.genre_ids?.map(getGenreName).join(', ') || '');
    setAnio(suggestion.release_date ? suggestion.release_date.split('-')[0] : '');
    setPoster(suggestion.poster_path ? `https://image.tmdb.org/t/p/w500${suggestion.poster_path}` : '');
    
    // Reanudar búsqueda después de un breve delay
    setTimeout(() => {
      setIsSelecting(false);
      setSuggestions([]);
    }, 500);
  };

  return {
    suggestions,
    searchLoading,
    handleSuggestionSelect
  };
}

export function getGenreName(id) {
  const genres = {
    28: 'Acción / Action',
    12: 'Aventura / Adventure',
    16: 'Animación / Animation',
    35: 'Comedia / Comedy',
    80: 'Crimen / Crime',
    99: 'Documental / Documentary',
    18: 'Drama',
    10751: 'Familia / Family',
    14: 'Fantasía / Fantasy',
    36: 'Historia / History',
    27: 'Terror / Horror',
    10402: 'Música / Music',
    9648: 'Misterio / Mystery',
    10749: 'Romance',
    878: 'Ciencia Ficción / Science Fiction',
    10770: 'Película de TV / TV Movie',
    53: 'Suspenso / Thriller',
    10752: 'Guerra / War',
    37: 'Western'
  };
  return genres[id] || 'Desconocido';
}

