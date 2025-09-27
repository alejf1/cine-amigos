import { useState, useEffect } from "react";

export function useMovieSearch(titulo, isSelecting = false, setIsSelecting) {
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
    // ✅ Siempre mostrar el título en inglés
    const displayTitle = suggestion.original_title || suggestion.title;

    setIsSelecting(true);
    setSuggestions([]);

    setTitulo(displayTitle);
    setGenero(suggestion.genre_ids?.map(getGenreName).join(', ') || '');
    setAnio(suggestion.release_date ? suggestion.release_date.split('-')[0] : '');

    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      const movieId = suggestion.id;

      // ✅ Detalles en español
      const detailsResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=es-ES`
      );
      const details = await detailsResponse.json();
      setSinopsis(details.overview || 'Sin sinopsis disponible');
      setDuracion(details.runtime || 0);

      // ✅ Buscar el poster "original" o en inglés
      const imagesResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${apiKey}`
      );
      const images = await imagesResponse.json();

      const posterPath =
        images.posters.find(p => p.iso_639_1 === "en")?.file_path ||
        images.posters.find(p => p.iso_639_1 === null)?.file_path ||
        images.posters[0]?.file_path;

      setPoster(posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "");

      // ✅ Director en español
      const creditsResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}&language=es-ES`
      );
      const credits = await creditsResponse.json();
      const director = credits.crew?.find(person => person.job === 'Director')?.name || 'Desconocido';
      setDirector(director);

    } catch (error) {
      console.error('Error fetching detalles de película:', error);
      setSinopsis('Sin sinopsis disponible');
      setDuracion(0);
      setPoster('');
      setDirector('Desconocido');
    }
  };

  return {
    suggestions,
    searchLoading,
    handleSuggestionSelect
  };
}

export function getGenreName(id) {
  const genres = {
    28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
    99: 'Documental', 18: 'Drama', 10751: 'Familia', 14: 'Fantasía', 36: 'Historia',
    27: 'Terror', 10402: 'Música', 9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'Guerra', 37: 'Western',
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };
  return genres[id] || 'Desconocido';
}
