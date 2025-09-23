// NotificationsDropdown.jsx
import { useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";

export default function NotificationsDropdown({ notifications, markAsRead }) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"
      >
        <BellIcon className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded-md shadow-md overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-2 ${n.leida ? "bg-gray-50" : "bg-white"} hover:bg-gray-100`}
                >
                  <p className="text-sm">{n.mensaje}</p>
                  {!n.leida && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No hay notificaciones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
