import { Dialog } from "@headlessui/react";
import { StarIcon } from "@heroicons/react/24/outline";

export default function RatingReminderModal({ open, onClose, movies, userId, updateRating }) {
  if (!movies || movies.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 overflow-y-auto max-h-[80vh]">
          <Dialog.Title className="text-lg font-bold mb-2">
            Tenés películas sin calificar
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Marcaste como vistas las siguientes películas, pero todavía no
            dejaste tu calificación:
          </Dialog.Description>
          <ul className="space-y-4 mb-4">
            {movies.map((m) => (
              <li key={m.id} className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <span className="text-gray-800 text-sm font-medium">{m.titulo}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateRating(m.id, star)}
                      className="p-1 rounded hover:bg-yellow-100 transition-colors"
                      title={`Calificar con ${star} estrella${star !== 1 ? 's' : ''}`}
                    >
                      <StarIcon className="w-5 h-5 text-yellow-400" />
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
