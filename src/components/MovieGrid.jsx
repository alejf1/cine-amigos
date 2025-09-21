import MovieCard from "./MovieCard";

export default function MovieGrid({ movies, currentUser, toggleView, onDelete, onEdit, updateRating }) {
  // Orden: primero las que nadie vio, luego ascendente por cantidad de vistas
  const sorted = [...movies].sort((a,b) => {
    const aCount = (a.vistas || []).filter(v=>v.estado==="vista").length;
    const bCount = (b.vistas || []).filter(v=>v.estado==="vista").length;
    if (aCount === 0 && bCount !== 0) return -1;
    if (bCount === 0 && aCount !== 0) return 1;
    return aCount - bCount;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {sorted.map(m => (
        <MovieCard
          key={m.id}
          movie={m}
          currentUser={currentUser}
          toggleView={toggleView}
          onDelete={onDelete}
          onEdit={onEdit}
          updateRating={updateRating} // ← NUEVO PROP
        />
      ))}
    </div>
  );
}
