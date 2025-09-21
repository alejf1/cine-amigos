import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useMovieSearch } from "../hooks/useMovieSearch";

export default function EditMovieModal({ open, setOpen, movie, updateMovie }) {
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [anio, setAnio] = useState("");
  const [poster, setPoster] = useState("");
  const [loading, setLoading] = useState(false);

  // ← USAR EL HOOK
  const { suggestions, searchLoading, handleSuggestionSelect } = useMovieSearch(titulo);

  // Pre-cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && movie) {
      setTitulo(movie.titulo || "");
      setGenero(movie.genero || "");
      setAnio(movie.anio ? movie.anio.toString() : "");
      setPoster(movie.poster || "");
    }
  }, [open, movie]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!titulo || !genero) return alert("Título y género son obligatorios");
    setLoading(true);
    
    const updatedData = {
      titulo,
      genero,
      anio: anio ? parseInt(anio) : null,
      poster
    };
    
    const ok = await updateMovie(movie.id, updatedData);
    setLoading(false);
    
    if (ok) {
      setTitulo(""); setGenero(""); setAnio(""); setPoster("");
      setOpen(false);
    } else {
      alert("Error al editar la película");
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
              <Dialog.Title className="text-lg font-bold mb-2">Editar película</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <input 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    placeholder="Título (se autocompletará)" 
                    className="w-full border p-2 rounded" 
                    required 
                  />
                  {/* ← MISMO DROPDOWN QUE ADD */}
                  {suggestions.length > 0 && (
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
                              onClick={() => handleSuggestionSelect(sug, setTitulo, setGenero, setAnio, setPoster)} 
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Actualizar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchLoading && (
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
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setOpen(false)} 
                    className="px-4 py-2 rounded bg-gray-100"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Actualizar"}
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

// ← IMPORTAR getGenreName
import { getGenreName } from "../hooks/useMovieSearch";
