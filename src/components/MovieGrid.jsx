import MovieCard from "./MovieCard";

export default function MovieGrid({ 
  movies, 
  currentUser, 
  toggleView, 
  onDelete, 
  onEdit, 
  updateRating,
  users, 
  sortMode, 
  filters 
}) {
  
  // ← FUNCIÓN DE FILTRADO COMPLETA
  const filteredMovies = movies.filter(movie => {
    const { viewStatus, genres, yearFrom, yearTo, myMovies, unrated } = filters;

    // Filtro por estado de vista del usuario actual
    if (viewStatus !== "all") {
      const userView = movie.vistas?.find(v => v.usuario_id === currentUser.id)?.estado;
      if (viewStatus === "vista" && userView !== "vista") return false;
      if (viewStatus === "no_vista" && userView !== "no vista") return false;
    }

    // Filtro por género (case insensitive)
    if (genres.length > 0 && movie.genero) {
      if (!genres.some(genre => 
        movie.genero.toLowerCase().includes(genre.toLowerCase())
      )) {
        return false;
      }
    }

    // Filtro por año
    if (yearFrom && movie.anio && movie.anio < parseInt(yearFrom)) return false;
    if (yearTo && movie.anio && movie.anio > parseInt(yearTo)) return false;

    // Filtro por mis películas
    if (myMovies && movie.agregado_por !== currentUser.id) return false;

    // Filtro por sin calificar
    if (unrated && movie.ratings && movie.ratings.length > 0) return false;

    return true;
  });

  // ← ORDENAMIENTO
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    if (sortMode === "topRated") {
      // Orden por promedio de ratings descendente
      const avgA = (a.ratings || []).reduce((sum, r) => sum + r.rating, 0) / Math.max(a.ratings?.length || 1, 1);
      const avgB = (b.ratings || []).reduce((sum, r) => sum + r.rating, 0) / Math.max(b.ratings?.length || 1, 1);
      return avgB - avgA; // Mayor a menor
    }

    // Orden default: primero las que nadie vio, luego ascendente por vistas
    const aCount = (a.vistas || []).filter(v => v.estado === "vista").length;
    const bCount = (b.vistas || []).filter(v => v.estado === "vista").length;
    if (aCount === 0 && bCount !== 0) return -1;
    if (bCount === 0 && aCount !== 0) return 1;
    return aCount - bCount;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {sortedMovies.length > 0 ? (
        sortedMovies.map(m => (
          <MovieCard
            key={m.id}
            movie={m}
            currentUser={currentUser}
            toggleView={toggleView}
            onDelete={onDelete}
            onEdit={onEdit}
            updateRating={updateRating}
            users={users}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-gray-500 text-lg mb-1">No se encontraron películas</p>
          <p className="text-sm text-gray-400">Probá ajustar los filtros o agregar alguna nueva</p>
        </div>
      )}
    </div>
  );
}
