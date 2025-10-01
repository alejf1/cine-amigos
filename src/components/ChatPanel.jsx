import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { ChatBubbleLeftIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function ChatPanel({ currentUser, users }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);

  // Clave para localStorage por usuario
  const lastSeenKey = `lastSeenMessage_${currentUser?.id || "temp"}`;

  // Actualiza el ref cuando cambia isOpen
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // =======================
  // Cargar mensajes iniciales
  // =======================
  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchMessages();
    }
  }, [isOpen, currentUser?.id]);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("mensajes")
      .select("*, usuarios(nombre)")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    const msgs = data.map((msg) => ({
      ...msg,
      usuarios: { nombre: users.find((u) => u.id === msg.usuario_id)?.nombre || "Anónimo" },
    }));

    setMessages(msgs);

    // Calcular no leídos usando localStorage
    const lastSeenTime = localStorage.getItem(lastSeenKey);
    const unread = lastSeenTime
      ? msgs.filter(
          (msg) =>
            new Date(msg.created_at).getTime() > new Date(lastSeenTime).getTime() &&
            msg.usuario_id !== currentUser.id
        ).length
      : msgs.filter((msg) => msg.usuario_id !== currentUser.id).length;

    setUnreadCount(unread);
  }

  // =======================
  // Suscripción Realtime
  // =======================
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel("chat-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          console.log("Received realtime INSERT:", payload);
          const sender = users.find((u) => u.id === payload.new.usuario_id);
          const newMsg = { ...payload.new, usuarios: { nombre: sender?.nombre || "Anónimo" } };

          setMessages((prev) => {
            if (!prev.some((msg) => msg.id === newMsg.id)) {
              return [...prev, newMsg];
            }
            return prev;
          });

          // Usa el ref para el valor actual
          if (payload.new.usuario_id !== currentUser.id && !isOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        console.log("Chat subscription status:", status);
      });

    return () => supabase.removeChannel(channel);
  }, [currentUser?.id, users]);

  // =======================
  // Resetear contador al abrir chat
  // =======================
  useEffect(() => {
    if (isOpen && messages.length > 0 && currentUser?.id) {
      localStorage.setItem(lastSeenKey, messages[messages.length - 1].created_at);
      setUnreadCount(0);
    }
  }, [isOpen, messages, currentUser?.id]);

  // =======================
  // Enviar mensaje
  // =======================
  async function sendMessage() {
    if (!newMessage.trim() || !currentUser?.id) return;

    const tempId = crypto.randomUUID();
    const tempMsg = {
      id: tempId,
      usuario_id: currentUser.id,
      mensaje: newMessage,
      created_at: new Date().toISOString(),
      usuarios: { nombre: currentUser.nombre || "Anónimo" },
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");
    if (!isOpen) setIsOpen(true);

    try {
      const { data, error } = await supabase
        .from("mensajes")
        .insert({
          usuario_id: currentUser.id,
          mensaje: newMessage,
        })
        .select("*, usuarios(nombre)")
        .single();

      if (error) throw error;

      // Reemplaza el mensaje temporal con el real
      const realMsg = {
        ...data,
        usuarios: { nombre: data.usuarios?.nombre || currentUser.nombre || "Anónimo" },
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? realMsg : msg))
      );
    } catch (err) {
      console.error("Error sending message:", err);
      // Remueve el mensaje temporal si falla
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  }

  // =======================
  // Auto-scroll al final
  // =======================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =======================
  // No mostrar chat si usuario no tiene chat habilitado
  // =======================
  if (!currentUser?.chat_habilitado) return null;

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-xl hover:bg-red-700 transition-all duration-200 z-[100]"
        title="Abrir chat"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <ChatBubbleLeftIcon className="w-7 h-7" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full px-2 py-1 shadow">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Panel de chat */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-20 right-6 w-full max-w-sm bg-white rounded-xl shadow-xl z-[100] flex flex-col max-h-[70vh]"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold">Chat del grupo</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              title="Cerrar chat"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 bg-white">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">
                No hay mensajes aún. ¡Sé el primero!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.usuario_id === currentUser.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.usuario_id === currentUser.id ? "bg-blue-100 text-right" : "bg-gray-100"
                    }`}
                  >
                    <p className="font-semibold">{msg.usuarios?.nombre || "Anónimo"}</p>
                    <p>{msg.mensaje}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center px-4 py-3 border-t border-gray-200">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
              disabled={!newMessage.trim()}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
