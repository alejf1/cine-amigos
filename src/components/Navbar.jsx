import { Fragment } from "react";
import { Menu } from "@headlessui/react";
import { PlusIcon, UserIcon } from "@heroicons/react/24/outline";

export default function Navbar({ 
  users, 
  currentUser, 
  setCurrentUser, 
  onOpenAdd, 
  sortMode, 
  setSortMode 
}) {
  return (
    <nav className="bg-white shadow sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">🎬 Los pibes cinéfilos</div>
          <div className="text-sm text-gray-500 hidden md:block">Son todos putos menos el Ale - By emi.</div>
        </div>

        <div className="flex items-center gap-3">
          {/* ← SELECTOR DE ORDENAMIENTO */}
          <div className="hidden sm:block">
            <label className="sr-only">Ordenar por</label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-gray-100 px-3 py-2 rounded-md text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="default">Predeterminado</option>
              <option value="topRated">⭐ Más valoradas</option>
            </select>
          </div>

          {/* ← BOTÓN MÓVIL PARA ORDENAMIENTO */}
          <div className="sm:hidden">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-gray-100 px-2 py-1 rounded-md text-xs border border-gray-200"
            >
              <option value="default">Orden</option>
              <option value="topRated">Más valoradas</option>
            </select>
          </div>

          <button
            onClick={onOpenAdd}
            className="bg-red-600 text-white px-3 py-2 rounded-md flex items-center gap-2 hover:bg-red-700 transition"
          >
            <PlusIcon className="w-4 h-4" /> Añadir
          </button>

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md">
              <UserIcon className="w-5 h-5 text-gray-600"/>
              <span className="text-sm">{currentUser ? currentUser.nombre : "Seleccionar"}</span>
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-md overflow-hidden">
              {users.map(u => (
                <Menu.Item key={u.id}>
                  {({ active }) => (
                    <button
                      onClick={() => setCurrentUser(u)}
                      className={`w-full text-left px-3 py-2 ${active ? "bg-gray-100" : ""}`}
                    >
                      {u.nombre}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
