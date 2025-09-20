import { motion } from "framer-motion";
import { TrashIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function MovieCard({ movie, currentUser, toggleView, onDelete }) {
  const vistasCount = (movie.vistas || []).filter(v => v.estado === "vista").length;
  const vistaUsuario = movie.vistas?.find(v => v.usuario_id === currentUser?.id)?.estado;
  const isOwner = movie.agregado_por === currentUser?.id;

  // estilos visuales: si lo viste -> highlight verde; si nadie lo vio -> borde llamativo
  const cardBg = vistaUsuario === "vista" ? "ring-2 ring-green-200" : (vistasCount === 0 ? "ring-2 ring-yellow-100" : "bg-white");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={`relative rounded-xl overflow-hidden shadow-md ${cardBg}`}
    >
      {/* Poster: si no hay poster, fondo placeholder */}
      <div className="aspect-[2/3] bg-gray-200 flex items-end">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
            {movie.titulo}
          </div>
        )}
      </div>

      <div className="p-3 bg-white">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-sm">{movie.titulo}</h3>
            <p className="text-xs text-gray-500">{movie.genero}{movie.anio ? ` · ${movie.anio}` : ""}</p>
          </div>

          <div className="text-xs text-gray-400">
            <div>{vistasCount}/{/* total usuarios unknown here, we could show total users count via prop */} vistos</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => toggleView(movie.id, currentUser.id, "vista")}
            className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${vistaUsuario === "vista" ? "bg-green-600 text-white" : "bg-gray-100"}`}
            title="Marcar como vista"
          >
            <EyeIcon className="w-4 h-4" /> Vi
          </button>

          <button
            onClick={() => toggleView(movie.id, currentUser.id, "no vista")}
            className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${vistaUsuario === "no vista" ? "bg-red-500 text-white" : "bg-gray-100"}`}
            title="Marcar como no vista"
          >
            <EyeSlashIcon className="w-4 h-4" /> No vi
          </button>
        </div>

        <div className="mt-2 flex justify-between items-center">
          {isOwner ? (
            <button
              onClick={() => onDelete(movie.id)}
              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
              title="Eliminar película"
            >
              <TrashIcon className="w-4 h-4" /> Eliminar
            </button>
          ) : (
            <div className="text-xs text-gray-400">Añadida por {movie.agregado_por_name || "alguien"}</div>
          )}
          <div className="text-xs text-gray-400">{vistasCount} vistas</div>
        </div>
      </div>
    </motion.div>
  );
}
