import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function AddMovieModal({ open, setOpen, addMovie }) {
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [anio, setAnio] = useState("");
  const [poster, setPoster] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!titulo || !genero) return alert("Título y género son obligatorios");
    setLoading(true);
    const ok = await addMovie({ titulo, genero, anio: anio ? parseInt(anio) : null, poster });
    setLoading(false);
    if (ok) {
      setTitulo(""); setGenero(""); setAnio(""); setPoster("");
      setOpen(false);
    } else {
      alert("Error al agregar la película");
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={setOpen}>
        <Transition.Child as={Fragment} /* overlay */>
          <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <Transition.Child as={Fragment}>
            <Dialog.Panel className="max-w-md w-full bg-white rounded-xl p-6 shadow-lg">
              <Dialog.Title className="text-lg font-bold mb-2">Añadir película</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título" className="w-full border p-2 rounded" />
                <input value={genero} onChange={e=>setGenero(e.target.value)} placeholder="Género" className="w-full border p-2 rounded" />
                <input value={anio} onChange={e=>setAnio(e.target.value)} placeholder="Año (opcional)" className="w-full border p-2 rounded" />
                <input value={poster} onChange={e=>setPoster(e.target.value)} placeholder="URL de poster (opcional)" className="w-full border p-2 rounded" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 rounded bg-gray-100">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white">{loading ? "Guardando..." : "Agregar"}</button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
