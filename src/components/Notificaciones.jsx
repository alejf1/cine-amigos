import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { BellIcon } from "@heroicons/react/24/outline";

export default function Notificaciones({ currentUser }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // ← SUSCRIPCIÓN REALTIME A NOTIFICACIONES
    const subscription = supabase
      .channel('notificaciones')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notificaciones',
          filter: `usuario_id=eq.${currentUser.id}` 
        }, 
        (payload) => {
          console.log('Nueva notificación en vivo:', payload);
          fetchNotificaciones();
        }
      )
      .subscribe();

    // Cargar notificaciones iniciales
    fetchNotificaciones();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const fetchNotificaciones = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('notificaciones')
      .select(`
        *,
        peliculas (
          id, titulo, poster, agregado_por, 
          usuarios!agregado_por_fkey (nombre, avatar)
        )
      `)
      .eq('usuario_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error cargando notificaciones:', error);
      return;
    }

    setNotificaciones(data || []);
    
    // Contar no leídas
    const noLeidas = data.filter(n => !n.leida).length;
    setNotificacionesNoLeidas(noLeidas);
  };

  const marcarLeida = async (notificacionId) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', notificacionId);

    if (!error) {
      fetchNotificaciones();
    }
  };

  const marcarTodasLeidas = async () => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', currentUser.id)
      .eq('leida', false); // Solo las no leídas

    if (!error) {
      setNotificacionesNoLeidas(0);
    }
  };

  // ← FUNCIÓN PARA NAVEGAR A PELÍCULA
  const irAPelicula = (peliculaId) => {
    // Scroll suave a la película
    const elemento = document.getElementById(`pelicula-${peliculaId}`);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Agregar highlight temporal
      elemento.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => elemento.classList.remove('ring-2', 'ring-blue-500'), 2000);
    }
    setShowDropdown(false);
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      {/* ← ÍCONO DE CAMPANA CON BADGE */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Notificaciones"
      >
        <BellIcon className="w-5 h-5 text-gray-600" />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg">
            {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* ← DROPDOWN DE NOTIFICACIONES */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* HEADER */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {notificacionesNoLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Marcar todas
              </button>
            )}
          </div>
          
          {/* LISTA DE NOTIFICACIONES */}
          <div className="divide-y divide-gray-100">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No hay nuevas notificaciones</p>
                <p className="text-xs text-gray-400 mt-1">Los pibes están tranqui</p>
              </div>
            ) : (
              notificaciones.map((notif) => {
                const pelicula = notif.peliculas;
                const usuarioAgrego = pelicula?.usuarios?.nombre || "Alguien";
                const avatar = pelicula?.usuarios?.avatar || usuarioAgrego.charAt(0);
                
                return (
                  <div 
                    key={notif.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.leida ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      if (!notif.leida) marcarLeida(notif.id);
                      if (pelicula) irAPelicula(pelicula.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* AVATAR */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full text-sm font-medium flex items-center justify-center ${
                          notif.leida 
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {avatar}
                        </div>
                      </div>
                      
                      {/* CONTENIDO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {usuarioAgrego} agregó una película
                          </h4>
                          {!notif.leida && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 truncate max-w-[200px]">
                          {pelicula?.titulo || "Una película nueva"}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(notif.created_at).toLocaleString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          {pelicula && (
                            <span className="text-blue-600 font-medium hover:text-blue-700 cursor-pointer">
                              Ver película →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* FOOTER SI HAY MÁS */}
          {notificaciones.length >= 10 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button className="text-xs text-blue-600 hover:text-blue-700">Ver todas</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
