import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { BellIcon } from "@heroicons/react/24/outline";

export default function NotificationsDropdown({ notifications, markAsRead }) {
  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md">
        <BellIcon className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-64 bg-white border rounded-md shadow-md overflow-hidden max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No hay notificaciones</div>
          ) : (
            notifications.map((notif) => (
              <Menu.Item key={notif.id}>
                <div
                  onClick={() => !notif.leida && markAsRead(notif.id)}
                  className={`p-3 text-sm cursor-pointer ${notif.leida ? "bg-gray-50 text-gray-500" : "bg-white text-gray-800"} hover:bg-gray-100`}
                >
                  {notif.mensaje}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              </Menu.Item>
            ))
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
