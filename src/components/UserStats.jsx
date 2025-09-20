export default function UserStats({ user, movies }) {
  if (!user) return null;
  const total = movies.length || 0;
  const vistas = movies.filter(m => m.vistas?.some(v => v.usuario_id === user.id && v.estado === "vista")).length;
  const porcentaje = total ? Math.round((vistas / total) * 100) : 0;
  return (
    <div className="bg-white p-3 rounded-md shadow-sm text-right">
      <div className="text-xs text-gray-500">Progreso</div>
      <div className="text-sm font-semibold">{vistas} / {total} · {porcentaje}%</div>
      <div className="w-40 bg-gray-200 h-2 rounded mt-2">
        <div className="h-2 bg-green-500 rounded" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}
