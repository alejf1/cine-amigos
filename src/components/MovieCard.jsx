import { motion } from "framer-motion";
import { TrashIcon, EyeIcon, EyeSlashIcon, PencilIcon, StarIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function MovieCard({ movie, currentUser, toggleView, onDelete, onEdit, updateRating }) {
  const vistasCount = (movie.vistas || []).filter(v => v.estado === "vista").length;
  const vistaUsuario = movie.vistas?.find(v => v.usuario_id === currentUser?.id)?.estado || "no vista";
  const userRating = movie.ratings?.find(r => r.usuario_id === currentUser?.id)?.rating;
  const isOwner = movie.agregado_por === currentUser?.id;
  const [showDetails, setShowDetails] = useState(false);

  const cardBg =
    vistaUsuario === "vista"
      ? "ring-2 ring-green-200"
      : vistasCount === 0
      ? "ring-2 ring-yellow-100"
      : "bg-white";

  const handleRating = async (rating) => {
    if (vistaUsuario !== "vista") {
      alert("¡Primero tenés que marcar que viste la película para poder calificarla! 😊");
      return;
    }
    
    if (userRating && userRating !== rating) {
      const mensaje = `Ya calificaste esta película con ${userRating} estrella${userRating !== 1 ? 's' : ''}. ` +
                     `¿Querés cambiarla a ${rating} estrella${rating !== 1 ? 's' : ''}?`;
      
      if (!confirm(mensaje)) {
        return;
      }
    }
    
    try {
      await updateRating(movie.id, currentUser.id, rating);
      console.log(`¡Película calificada con ${rating} estrella${rating !== 1 ? 's' : ''}! ⭐`);
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      alert('Hubo un error al guardar tu calificación. Intentá de nuevo.');
    }
  };

  const ratings = movie.ratings || [];
  const ratingsCount = ratings.length;
  const averageRating = ratingsCount >= 2 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount).toFixed(1) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={`relative rounded-xl overflow-hidden shadow-md ${cardBg}`}
    >
      <div
        className="aspect-[2/3] bg-gray-200 flex items-end cursor-pointer relative"
        onClick={() => setShowDetails(!showDetails)}
      >
        {movie.poster ? (
          <img src={movie.poster} alt={movie.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
            {movie.titulo}
          </div>
        )}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-black/90 text-white flex flex-col rounded-xl"
          >
            {/* Sección fija: Título, Director, Duración */}
            <div className="p-3 sm:p-4 bg-black/95 border-b border-gray-700">
              <h4 className="text-lg font-bold">Detalles</h4>
              <p className="text-sm mt-1">
                <strong>Director:</strong> {movie.director || 'Desconocido'}
              </p>
              <p className="text-sm">
                <strong>Duración:</strong> {movie.duracion ? `${movie.duracion} min` : 'N/A'}
              </p>
            </div>
            {/* Sección con scroll: Sinopsis */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <p className="text-sm">
                <strong>Sinopsis:</strong> {movie.sinopsis || 'Sin sinopsis disponible'}
              </p>
            </div>
          </motion.div>
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
            onClick={() => toggleView(movie.id, currentUser?.id, "vista")}
            disabled={!currentUser}
            className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${
              vistaUsuario === "vista" ? "bg-green-600 text-white" : "bg-gray-100"
            } ${!currentUser ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Marcar como vista"
          >
            <EyeIcon className="w-4 h-4" /> Vi
          </button>

          <button
            onClick={() => toggleView(movie.id, currentUser?.id, "no vista")}
            disabled={!currentUser}
            className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${
              vistaUsuario === "no vista" ? "bg-red-500 text-white" : "bg-gray-100"
            } ${!currentUser ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Marcar como no vista"
          >
            <EyeSlashIcon className="w-4 h-4" /> No vi
          </button>
        </div>

        <div className="mt-2 space-y-2">
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
                  (Tu: {userRating})
                </span>
              )}
            </div>
          </div>

          {ratingsCount >= 2 && (
            <div className="flex justify-center items-center text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                <span>Promedio: {averageRating} ({ratingsCount} calif.)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
