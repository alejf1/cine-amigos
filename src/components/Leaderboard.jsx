export default function Leaderboard({ users, movies }) {
  const ranking = (users || []).map(u => {
    const total = movies.length;
    const vistas = movies.filter(m => m.vistas?.some(v => v.usuario_id === u.id && v.estado === "vista")).length;
    const porcentaje = total ? Math.round((vistas/total)*100) : 0;
    return { ...u, vistas, porcentaje };
  }).sort((a,b)=>b.porcentaje - a.porcentaje);

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
                <div className="text-xs text-gray-400">{u.vistas || 0} vistas</div>
              </div>
            </div>
            <div className="text-sm font-semibold">{u.porcentaje}%</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
