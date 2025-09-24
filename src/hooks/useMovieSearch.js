import { useState, useEffect } from "react";

export function useMovieSearch(
  titulo,
  isSelecting = false,
  setIsSelecting,
  setTitulo,
  setGenero,
  setAnio,
  setPoster,
  setSinopsis,
  setDuracion,
  setDirector
) {
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
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
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
              titulo
            )}&language=es-ES&include_adult=false`
          ),
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
              titulo
            )}&language=en-US&include_adult=false`
          ),
        ]);

        const [esData, enData] = await Promise.all([esResponse.json(), enResponse.json()]);

        const combined = [
          ...(esData.results || []),
          ...enData.results.filter(
            (enMovie) => !esData.results.some((esMovie) => esMovie.title.toLowerCase() === enMovie.title.toLowerCase())
          ),
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

  const handleSuggestionSelect = async (
    suggestion,
    setTitulo,
    setGenero,
    setAnio,
    setPoster,
    setIsSelecting,
    setSinopsis,
    setDuracion,
    setDirector
  ) => {
    const isSpanish = suggestion.original_title?.toLowerCase() !== suggestion.title?.toLowerCase();
    const displayTitle = isSpanish ? suggestion.title : suggestion.original_title || suggestion.title;

    setIsSelecting(true);
    setSuggestions([]);

    setTitulo(displayTitle);
    setGenero(suggestion.genre_ids?.map(getGenreName).join(', ') || '');
    setAnio(suggestion.release_date ? suggestion.release_date.split('-')[0] : '');
    setPoster(suggestion.poster_path ? `https://image.tmdb.org/t/p/w500${suggestion.poster_path}` : '');

    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      const detailsResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${suggestion.id}?api_key=${apiKey}&language=es-ES&append_to_response=credits`
      );
      const details = await detailsResponse.json();

      setSinopsis(details.overview || 'Sin sinopsis disponible');
      setDuracion(details.runtime || null);
      setDirector(details.credits?.crew?.find((c) => c.job === 'Director')?.name || 'Desconocido');
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setSinopsis('');
      setDuracion(null);
      setDirector('');
    }
  };

  return {
    suggestions,
    searchLoading,
    handleSuggestionSelect,
  };
}

export function getGenreName(id) {
  const genres = {
    28: 'Acción',
    12: 'Aventura',
    16: 'Animación',
    35: 'Comedia',
    80: 'Crimen',
    99: 'Documental',
    18: 'Drama',
    10751: 'Familia',
    14: 'Fantasía',
    36: 'Historia',
    27: 'Terror',
    10402: 'Música',
    9648: 'Misterio',
    10749: 'Romance',
    878: 'Ciencia Ficción',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'Guerra',
    37: 'Western',
  };
  return genres[id] || 'Desconocido';
}
