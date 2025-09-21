import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function EditMovieModal({ open, setOpen, movie, updateMovie }) {
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [anio, setAnio] = useState("");
  const [poster, setPoster] = useState("");
  const [loading, setLoading] = useState(false);

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
                <input 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)} 
                  placeholder="Título" 
                  className="w-full border p-2 rounded" 
                  required 
                />
                <input 
                  value={genero} 
                  onChange={e => setGenero(e.target.value)} 
                  placeholder="Género" 
                  className="w-full border p-2 rounded" 
                  required 
                />
                <input 
                  value={anio} 
                  onChange={e => setAnio(e.target.value)} 
                  placeholder="Año (opcional)" 
                  className="w-full border p-2 rounded" 
                  type="number"
                />
                <input 
                  value={poster} 
                  onChange={e => setPoster(e.target.value)} 
                  placeholder="URL de poster (opcional)" 
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
