// App.jsx (actualizado con filtros)
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";
import AddMovieModal from "./components/AddMovieModal";
import EditMovieModal from "./components/EditMovieModal";
import UserStats from "./components/UserStats";
import Leaderboard from "./components/Leaderboard";

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  // Estados para filtros
  const [filterViewStatus, setFilterViewStatus] = useState('all'); // 'all', 'vista', 'no vista'
  const [filterRecent, setFilterRecent] = useState(false); // true para mostrar agregadas recientemente
  const [filterTopRated, setFilterTopRated] = useState(false); // true para ordenar por promedio de ratings

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAll(); // Recargar datos cuando cambie el usuario seleccionado
      const channel = supabase.channel('notifs-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${currentUser.id}`
        }, (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [currentUser]);

  async function fetchAll() {
    try {
      console.log("Usuario de auth: no se usa autenticación");
      console.log("Usuario seleccionado:", currentUser?.id, currentUser?.nombre);

      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("*")
        .order("nombre");

      console.log(
        "Usuarios de DB:",
        usuarios?.map((u) => ({ id: u.id, nombre: u.nombre }))
      );

      const { data: peliculas } = await supabase
        .from("peliculas")
        .select("*, vistas(*), ratings (*, usuarios (nombre))")
        .order("titulo");

      const normalized =
        peliculas?.map((p) => ({
          ...p,
          vistas: p.vistas || [],
          ratings: p.ratings || [],
        })) || [];

      let notifs = [];
      if (currentUser?.id) {
        console.log("Cargando notificaciones para usuario:", currentUser.id);
        const { data: notifData, error } = await supabase
          .from("notificaciones")
          .select("*")
          .eq("usuario_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) {
          console.error("Error al cargar notificaciones:", error);
        } else {
          console.log("Notificaciones obtenidas:", notifData);
          notifs = notifData || [];
        }
      } else {
        console.log("No hay usuario seleccionado, no se cargan notificaciones");
      }

      setUsers(usuarios || []);
      setMovies(normalized);
      setNotifications(notifs);

      if (!currentUser && usuarios?.length > 0) {
        console.log("Estableciendo usuario por defecto:", usuarios[0].id, usuarios[0].nombre);
        setCurrentUser(usuarios[0]);
      }

      console.log("Usuario actual final:", currentUser?.id);
      console.log("Películas cargadas:", normalized.length);
      console.log("Notificaciones cargadas:", notifs.length);
    } catch (error) {
      console.error("Error en fetchAll:", error);
    }
  }

  // Función para filtrar y ordenar películas
  const filteredMovies = () => {
    let filtered = [...movies];

    // Filtro: Vistas y no vistas
    if (filterViewStatus !== 'all' && currentUser?.id) {
      filtered = filtered.filter((m) => {
        const vista = m.vistas.find((v) => v.usuario_id === currentUser.id);
        if (filterViewStatus === 'vista') {
          return vista && vista.estado === 'vista';
        } else if (filterViewStatus === 'no vista') {
          return !vista || vista.estado === 'no vista';
        }
        return true;
      });
    }

    // Filtro: Agregadas recientemente (últimos 7 días)
    if (filterRecent) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((m) => new Date(m.created_at) >= sevenDaysAgo);
    }

    // Ordenar: Las más valoradas (promedio de ratings descendente)
    if (filterTopRated) {
      filtered = filtered.sort((a, b) => {
        const avgA = a.ratings.reduce((sum, r) => sum + r.rating, 0) / (a.ratings.length || 1);
        const avgB = b.ratings.reduce((sum, r) => sum + r.rating, 0) / (b.ratings.length || 1);
        return avgB - avgA;
      });
    }

    return filtered;
  };

  // Resetear filtros
  const resetFilters = () => {
    setFilterViewStatus('all');
    setFilterRecent(false);
    setFilterTopRated(false);
  };

  async function addMovie(payload) {
    // Código existente, sin cambios
  }

  async function markAsRead(notifId) {
    // Código existente, sin cambios
  }

  // Otras funciones (toggleView, deleteMovie, etc.) sin cambios

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        users={users}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenAdd={() => setOpenAdd(true)}
        notifications={notifications}
        markAsRead={markAsRead}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Novedades del grupo</h1>
              <p className="text-sm text-gray-500">
                Explorá las recomendaciones de los pibes.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <UserStats user={currentUser} movies={movies} />
            </div>
          </div>
        </section>

        {/* Sección de filtros (cuadrado rojo) */}
        <section className="mb-4 bg-white p-4 rounded-md shadow flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Filtro Vistas y no vistas */}
            <div className="flex flex-col w-full md:w-auto">
              <label className="text-sm font-medium mb-1">Vistas</label>
              <select
                value={filterViewStatus}
                onChange={(e) => setFilterViewStatus(e.target.value)}
                className="border p-2 rounded-md w-full md:w-40"
              >
                <option value="all">Todas</option>
                <option value="vista">Vistas</option>
                <option value="no vista">No vistas</option>
              </select>
            </div>

            {/* Filtro Agregadas recientemente */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterRecent}
                onChange={(e) => setFilterRecent(e.target.checked)}
                className="h-4 w-4"
              />
              <label className="text-sm font-medium">Agregadas recientemente</label>
            </div>

            {/* Filtro Las más valoradas */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterTopRated}
                onChange={(e) => setFilterTopRated(e.target.checked)}
                className="h-4 w-4"
              />
              <label className="text-sm font-medium">Las más valoradas</label>
            </div>
          </div>

          {/* Botón de reset */}
          <button
            onClick={resetFilters}
            className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition w-full md:w-auto"
          >
            Limpiar filtros
          </button>
        </section>

        <section className="mb-8">
          {currentUser ? (
            <MovieGrid
              movies={filteredMovies()} // Pasar películas filtradas
              currentUser={currentUser}
              toggleView={toggleView}
              onDelete={deleteMovie}
              onEdit={handleEditMovie}
              updateRating={updateRating}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Por favor, selecciona un usuario.</p>
            </div>
          )}
        </section>
        <section>
          <Leaderboard users={users} movies={movies} />
        </section>
      </main>
      <AddMovieModal open={openAdd} setOpen={setOpenAdd} addMovie={addMovie} />
      <EditMovieModal
        open={openEdit}
        setOpen={setOpenEdit}
        movie={editingMovie}
        updateMovie={updateMovie}
      />
    </div>
  );
}
