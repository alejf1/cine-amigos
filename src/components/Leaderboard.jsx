export default function Leaderboard({ users, movies }) {
  const ranking = (users || []).map(u => {
    const total = movies.length;
    const vistas = movies.filter(m => m.vistas?.some(v => v.usuario_id === u.id && v.estado === "vista")).length;
    const porcentaje = total ? Math.round((vistas/total)*100) : 0;
    
    // ← NUEVO: Calcular promedio de ratings
    const userRatings = movies
      .filter(m => m.ratings?.some(r => r.usuario_id === u.id))
      .map(m => {
        const rating = m.ratings.find(r => r.usuario_id === u.id);
        return rating ? rating.rating : 0;
      });
    const avgRating = userRatings.length > 0 ? (userRatings.reduce((a, b) => a + b, 0) / userRatings.length).toFixed(1) : 0;
    const ratingsCount = userRatings.length;
    
    return { 
      ...u, 
      vistas, 
      porcentaje,
      avgRating: parseFloat(avgRating),
      ratingsCount
    };
  }).sort((a,b) => {
    // Primero por porcentaje de vistas, luego por promedio de ratings
    if (a.porcentaje !== b.porcentaje) return b.porcentaje - a.porcentaje;
    return b.avgRating - a.avgRating;
  });

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-bold mb-3">🏆 Ranking del grupo</h2>
      <ul className="space-y-2">
        {ranking.map((u, idx) => (
          <li key={u.id} className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : u.nombre.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{u.nombre}</div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>{u.vistas || 0} vistas</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                    {u.avgRating} ({u.ratingsCount})
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold">{u.porcentaje}%</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
