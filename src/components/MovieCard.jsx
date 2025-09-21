import { motion } from "framer-motion";
import { TrashIcon, EyeIcon, EyeSlashIcon, PencilIcon, StarIcon } from "@heroicons/react/24/outline";

export default function MovieCard({ movie, currentUser, toggleView, onDelete, onEdit, updateRating }) {
  const vistasCount = (movie.vistas || []).filter(v => v.estado === "vista").length;
  const vistaUsuario = movie.vistas?.find(v => v.usuario_id === currentUser?.id)?.estado;
  const userRating = movie.ratings?.find(r => r.usuario_id === currentUser?.id)?.rating;
  const isOwner = movie.agregado_por === currentUser?.id;

  // estilos visuales: si lo viste -> highlight verde; si nadie lo vio -> borde llamativo
  const cardBg =
    vistaUsuario === "vista"
      ? "ring-2 ring-green-200"
      : vistasCount === 0
      ? "ring-2 ring-yellow-100"
      : "bg-white";

  // Función para actualizar rating (solo si vio la película)
  const handleRating = async (rating) => {
    // 1. Validación: solo permitir calificar si vio la película
    if (vistaUsuario !== "vista") {
      alert("¡Primero tenés que marcar que viste la película para poder calificarla! 😊");
      return;
    }
    
    // 2. Si ya tiene calificación, confirmar el cambio
    if (userRating && userRating !== rating) {
      const mensaje = `Ya calificaste esta película con ${userRating} estrella${userRating !== 1 ? 's' : ''}. ` +
                     `¿Querés cambiarla a ${rating} estrella${rating !== 1 ? 's' : ''}?`;
      
      if (!confirm(mensaje)) {
        return; // Usuario canceló el cambio
      }
    }
    
    // 3. Actualizar la calificación
    try {
      await updateRating(movie.id, currentUser.id, rating);
      console.log(`¡Película calificada con ${rating} estrella${rating !== 1 ? 's' : ''}! ⭐`);
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      alert('Hubo un error al guardar tu calificación. Intentá de nuevo.');
    }
  };

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

      <div className="p-2 sm:p-3 bg-white">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-sm">{movie.titulo}</h3>
            <p className="text-xs text-gray-500">
              {movie.genero}
              {movie.anio ? ` · ${movie.anio}` : ""}
            </p>
          </div>

          <div className="text-xs text-gray-400">
            <div>{vistasCount} vistos</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => toggleView(movie.id, currentUser.id, "vista")}
            className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${
              vistaUsuario === "vista" ? "bg-green-600 text-white" : "bg-gray-100"
            }`}
            title="Marcar como vista"
          >
            <EyeIcon className="w-4 h-4" /> Vi
          </button>

          <button
            onClick={() => toggleView(movie.id, currentUser.id, "no vista")}
            className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${
              vistaUsuario === "no vista" ? "bg-red-500 text-white" : "bg-gray-100"
            }`}
            title="Marcar como no vista"
          >
            <EyeSlashIcon className="w-4 h-4" /> No vi
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {/* PRIMERA FILA: Botones de acción si es dueño */}
          <div className="flex justify-center items-center gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => onEdit(movie)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-blue-50"
                  title="Editar película"
                >
                  <PencilIcon className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={() => onDelete(movie.id)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-red-50"
                  title="Eliminar película"
                >
                  <TrashIcon className="w-4 h-4" /> Eliminar
                </button>
              </>
            ) : null}
          </div>

          {/* SEGUNDA FILA: Estrellas con feedback visual */}
          <div className="flex justify-center items-center pb-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  disabled={vistaUsuario !== "vista"}
                  className={`
                    p-1 rounded transition-all duration-200 flex items-center justify-center
                    ${
                      vistaUsuario !== "vista"
                        ? "text-gray-300 cursor-not-allowed opacity-50"
                        : userRating >= star
                          ? "text-yellow-400 hover:text-yellow-500 cursor-pointer shadow-sm"
                          : "text-gray-400 hover:text-yellow-400 cursor-pointer"
                    }
                  `}
                  title={
                    vistaUsuario !== "vista"
                      ? "Solo podés calificar películas que viste"
                      : `Calificar con ${star} estrella${star !== 1 ? 's' : ''}`
                  }
                >
                  <StarIcon
                    className={`
                      w-4 h-4 transition-all duration-200
                      ${
                        vistaUsuario !== "vista"
                          ? "stroke-gray-300 opacity-50"
                          : userRating >= star
                            ? "fill-current stroke-yellow-400"
                            : "stroke-gray-400"
                      }
                    `}
                  />
                </button>
              ))}
              
              {userRating > 0 && (
                <span className="text-xs text-gray-600 font-medium ml-1">
                  ({userRating})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
