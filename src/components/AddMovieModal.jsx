import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useMovieSearch, getGenreName } from "../hooks/useMovieSearch";

export default function AddMovieModal({ open, setOpen, addMovie }) {
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [anio, setAnio] = useState("");
  const [poster, setPoster] = useState("");
  const [sinopsis, setSinopsis] = useState("");
  const [duracion, setDuracion] = useState(0);
  const [director, setDirector] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [viewStatus, setViewStatus] = useState("vista");
  const { suggestions, searchLoading, handleSuggestionSelect } = useMovieSearch(titulo, isSelecting, setIsSelecting);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!titulo || !genero) return alert("Título y género son obligatorios");
    setLoading(true);

    const ok = await addMovie({
      titulo,
      genero,
      anio: anio ? parseInt(anio) : null,
      poster,
      vistaEstado: viewStatus,
      sinopsis,
      duracion,
      director
    });

    setLoading(false);
    if (ok) {
      setTitulo("");
      setGenero("");
      setAnio("");
      setPoster("");
      setSinopsis("");
      setDuracion(0);
      setDirector("");
      setViewStatus("vista");
      setIsSelecting(false);
      setOpen(false);
    } else {
      alert("Error al agregar la película");
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={setOpen}>
        <Transition.Child as={Fragment}>
          <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <Transition.Child as={Fragment}>
            <Dialog.Panel className="max-w-md w-full bg-white rounded-xl p-6 shadow-lg">
              <Dialog.Title className="text-lg font-bold mb-2">Añadir película</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    value={titulo}
                    onChange={e => {
                      setTitulo(e.target.value);
                      setIsSelecting(false);
                    }}
                    placeholder="Título (se autocompletará)"
                    className="w-full border p-2 rounded"
                    required
                  />
                  {suggestions.length > 0 && !isSelecting && (
                    <ul className="absolute z-50 w-full bg-white border mt-1 rounded-md shadow-lg max-h-48 overflow-auto">
                      {suggestions.map((sug, idx) => (
                        <li key={idx} className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                          <div className="flex items-center gap-3">
                            {sug.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w92${sug.poster_path}`}
                                alt={sug.title}
                                className="w-12 h-18 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-18 bg-gray-200 rounded flex items-center justify-center text-xs">No poster</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{sug.title}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>{sug.release_date ? sug.release_date.split('-')[0] : 'N/A'}</span>
                                <span className="px-1 py-px bg-blue-100 text-blue-800 text-xs rounded">
                                  {sug.original_language?.toUpperCase() || 'ES'}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{sug.genre_ids?.map(getGenreName).join(', ')}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleSuggestionSelect(sug, setTitulo, setGenero, setAnio, setPoster, setIsSelecting, setSinopsis, setDuracion, setDirector);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              disabled={isSelecting}
                            >
                              Usar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchLoading && !isSelecting && (
                    <div className="absolute right-2 top-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <input
                  value={genero}
                  onChange={e => setGenero(e.target.value)}
                  placeholder="Género (se autocompletará)"
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  value={anio}
                  onChange={e => setAnio(e.target.value)}
                  placeholder="Año (se autocompletará)"
                  className="w-full border p-2 rounded"
                  type="number"
                />
                <input
                  value={poster}
                  onChange={e => setPoster(e.target.value)}
                  placeholder="Poster (se autocompletará)"
                  className="w-full border p-2 rounded"
                />
                <textarea
                  value={sinopsis}
                  onChange={e => setSinopsis(e.target.value)}
                  placeholder="Sinopsis (se autocompletará)"
                  className="w-full border p-2 rounded h-24"
                />
                <input
                  value={duracion}
                  onChange={e => setDuracion(parseInt(e.target.value) || 0)}
                  placeholder="Duración en minutos (se autocompletará)"
                  className="w-full border p-2 rounded"
                  type="number"
                />
                <input
                  value={director}
                  onChange={e => setDirector(e.target.value)}
                  placeholder="Director (se autocompletará)"
                  className="w-full border p-2 rounded"
                />
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Ya la viste?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewStatus("vista")}
                      className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${
                        viewStatus === "vista" ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <EyeIcon className="w-4 h-4" /> Sí, la vi
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewStatus("no vista")}
                      className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${
                        viewStatus === "no vista" ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <EyeSlashIcon className="w-4 h-4" /> No la vi
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded bg-gray-100">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white" disabled={loading}>
                    {loading ? "Guardando..." : "Agregar"}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
