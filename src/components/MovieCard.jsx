import { motion } from "framer-motion";
import { useState } from "react";
import { TrashIcon, EyeIcon, EyeSlashIcon, PencilIcon, StarIcon } from "@heroicons/react/24/outline";

export default function MovieCard({ movie, currentUser, toggleView, onDelete, onEdit, updateRating }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const vistasCount = (movie.vistas || []).filter((v) => v.estado === "vista").length;
  const vistaUsuario = movie.vistas?.find((v) => v.usuario_id === currentUser?.id)?.estado;
  const userRating = movie.ratings?.find((r) => r.usuario_id === currentUser?.id)?.rating;
  const isOwner = movie.agregado_por === currentUser?.id;

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
        className="flip-card aspect-[2/3]"
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalles de ${movie.titulo}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsFlipped(!isFlipped);
          }
        }}
      >
        <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="flip-card-front">
            {movie.poster ? (
              <img src={movie.poster} alt={movie.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                {movie.titulo}
              </div>
            )}
          </div>
          <div className="flip-card-back p-4 bg-white overflow-auto">
            <h4 className="font-semibold text-sm mb-2">{movie.titulo}</h4>
            {movie.director && (
              <p className="text-xs text-gray-600 mb-2">Director: {movie.director}</p>
            )}
            {movie.duracion && (
              <p className="text-xs text-gray-600 mb-2">Duración: {movie.duracion} min</p>
            )}
            <p className="text-xs text-gray-700">{movie.sinopsis || 'Sin sinopsis disponible'}</p>
          </div>
        </div>
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
