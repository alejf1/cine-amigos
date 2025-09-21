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
    // Opción A: Mostrar mensaje y no hacer nada
    alert("¡Primero tenés que marcar que viste la película para poder calificarla! 😊");
    return;
    
    // Opción B: Auto-marcar como vista (descomenta si querés esta funcionalidad)
    // await toggleView(movie.id, currentUser.id, "vista");
    // // Continuar con la calificación después de marcar como vista
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
{/* SEGUNDA FILA: Estrellas con estado según si vio la película */}
<div className="flex justify-center items-center pb-1">
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => {
      // Determinar estado de la estrella
      const isDisabled = vistaUsuario !== "vista"; // Deshabilitada si no vio la película
      const isSelected = userRating >= star; // Seleccionada si está en el rating actual
      const showHover = !isDisabled && !userRating; // Hover solo si no hay calificación previa
      
      return (
        <button
          key={star}
          onClick={() => handleRating(star)}
          disabled={isDisabled}
          className={`
            p-1 rounded transition-all duration-200 flex items-center justify-center
            ${
              isDisabled
                ? "text-gray-300 cursor-not-allowed" // Gris y sin cursor
                : isSelected
                  ? "text-yellow-400 hover:text-yellow-500 cursor-pointer" // Amarillo seleccionado
                  : showHover
                    ? "text-gray-400 hover:text-yellow-400 cursor-pointer" // Gris con hover
                    : "text-gray-400 cursor-pointer" // Gris sin hover (ya calificado)
            }
          `}
          title={
            isDisabled
              ? "Marcá 'Vi' primero para poder calificar"
              : isSelected
                ? `Ya calificaste con ${star} estrella${star !== 1 ? 's' : ''}`
                : `Calificar con ${star} estrella${star !== 1 ? 's' : ''}`
          }
        >
          <StarIcon
            className={`
              w-4 h-4 transition-colors duration-200
              ${
                isDisabled
                  ? "stroke-gray-300" // Sin relleno si está deshabilitada
                  : isSelected
                    ? "fill-current stroke-yellow-400" // Rellena si está seleccionada
                    : "stroke-gray-400" // Solo borde si no está seleccionada
              }
            `}
          />
        </button>
      );
    })}
   
    {/* Mostrar calificación actual */}
    {userRating > 0 && (
      <span className="text-xs text-gray-600 font-medium ml-2">
        ({userRating})
      </span>
    )}
   
    {/* Hint si no puede calificar */}
    {vistaUsuario !== "vista" && !userRating && (
      <span className="text-xs text-gray-400 ml-2 italic">
        (Marcá "Vi" primero)
      </span>
    )}
  </div>
</div>
        </div>
      </div>
    </motion.div>
  );
}



