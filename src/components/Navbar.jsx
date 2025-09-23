// Navbar.jsx
import { PlusIcon, UserIcon } from "@heroicons/react/24/outline";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Navbar({ users, currentUser, onOpenAdd, notifications, markAsRead, signOut }) {
  return (
    <nav className="bg-white shadow sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">🎬 Los pibes cinéfilos</div>
          <div className="text-sm text-gray-500 hidden md:block">Son todos putos menos el Ale - By emi.</div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={onOpenAdd}
              className="bg-red-600 text-white px-3 py-2 rounded-md flex items-center gap-2 hover:bg-red-700 transition"
            >
              <PlusIcon className="w-4 h-4" /> Añadir
            </button>
          )}

          <NotificationsDropdown notifications={notifications} markAsRead={markAsRead} />

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">{currentUser.user_metadata?.nombre || currentUser.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-500">Invitado</div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
