import { StarIcon } from "@heroicons/react/24/outline";

export default function UserStats({ user, movies }) {
  if (!user) return null;
  const total = movies.length || 0;
  const vistas = movies.filter(m => m.vistas?.some(v => v.usuario_id === user.id && v.estado === "vista")).length;
  const porcentaje = total ? Math.round((vistas / total) * 100) : 0;
  
  // ← NUEVO: Estadísticas de ratings
  const userRatings = movies
    .filter(m => m.ratings?.some(r => r.usuario_id === user.id))
    .map(m => {
      const rating = m.ratings.find(r => r.usuario_id === user.id);
      return rating ? rating.rating : 0;
    });
  const avgRating = userRatings.length > 0 ? (userRatings.reduce((a, b) => a + b, 0) / userRatings.length).toFixed(1) : 0;
  const ratingsCount = userRatings.length;

  // ← NUEVO: Pendientes de calificar (para mostrar un pequeño indicador)
  const pendingToRateCount = movies.filter(m => {
    const vista = m.vistas?.find(v => v.usuario_id === user.id);
    const hasSeen = vista?.estado === "vista";
    const hasRated = m.ratings?.some(r => r.usuario_id === user.id);
    return hasSeen && !hasRated;
  }).length;

  return (
    <div className="bg-white p-3 rounded-md shadow-sm text-right">
      <div className="text-xs text-gray-500">Progreso</div>
      <div className="text-sm font-semibold">{vistas} / {total} · {porcentaje}%</div>
      <div className="w-40 bg-gray-200 h-2 rounded mt-2">
        <div className="h-2 bg-green-500 rounded" style={{ width: `${porcentaje}%` }} />
      </div>
      
      {/* ← NUEVO: Sección de ratings */}
      {ratingsCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">Promedio</div>
          <div className="text-sm font-semibold flex items-center justify-end gap-1">
            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
            {avgRating} ({ratingsCount})
          </div>
        </div>
      )}

      {/* ← NUEVO: Indicador de pendientes */}
      {pendingToRateCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-right">
          <div className="text-xs text-gray-500">Pendientes</div>
          <div className="text-sm font-semibold text-right">
            {pendingToRateCount} sin calificar
          </div>
        </div>
      )}
    </div>
  );
}
