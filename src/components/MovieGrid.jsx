import MovieCard from "./MovieCard";

export default function MovieGrid({ 
  movies, 
  currentUser, 
  toggleView, 
  onDelete, 
  onEdit, 
  updateRating,
  sortMode = "default",
  viewStatus = "all"
}) {
  
  // ← PASO 1: FILTRADO POR ESTADO DE VISTA
  let filteredMovies = movies.filter(movie => {
    if (viewStatus === "vista") {
      const userView = movie.vistas?.find(v => v.usuario_id === currentUser.id)?.estado;
      return userView === "vista";
    }
    if (viewStatus === "no_vista") {
      const userView = movie.vistas?.find(v => v.usuario_id === currentUser.id)?.estado;
      return userView === "no_vista";
    }
    return true; // "all" muestra todo
  });

  // ← PASO 2: ORDENAMIENTO
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    if (sortMode === "topRated") {
      // Orden por promedio de ratings descendente
      const avgA = (a.ratings || []).reduce((sum, r) => sum + r.rating, 0) / Math.max((a.ratings?.length || 1), 1);
      const avgB = (b.ratings || []).reduce((sum, r) => sum + r.rating, 0) / Math.max((b.ratings?.length || 1), 1);
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
      {sortedMovies.map(m => (
        <MovieCard
          key={m.id}
          movie={m}
          currentUser={currentUser}
          toggleView={toggleView}
          onDelete={onDelete}
          onEdit={onEdit}
          updateRating={updateRating}
        />
      ))}
    </div>
  );
}
