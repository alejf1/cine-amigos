import { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";
import AddMovieModal from "./components/AddMovieModal";
import EditMovieModal from "./components/EditMovieModal";
import UserStats from "./components/UserStats";
import Leaderboard from "./components/Leaderboard";
import RatingReminderModal from "./components/RatingReminderModal";
import ChatPanel from "./components/ChatPanel";

export default function App({ preselectedUser }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(preselectedUser || null);
  const [movies, setMovies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [movieToEdit, setMovieToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'seen', 'unseen'
  const [showReminder, setShowReminder] = useState(false);
  const [pendingRatings, setPendingRatings] = useState([]);

  // Memoizar currentUser y users para estabilidad
  const memoizedCurrentUser = useMemo(() => currentUser, [currentUser?.id]);
  const memoizedUsers = useMemo(() => users, [users?.length]);

  // Log para depurar cambios en props
  useEffect(() => {
    console.log("App.jsx: currentUser:", memoizedCurrentUser, "users:", memoizedUsers);
  }, [memoizedCurrentUser, memoizedUsers]);

  // Carga inicial
  useEffect(() => {
    fetchAll();
  }, []);

  // Revisa si hay películas vistas pero sin calificación
  useEffect(() => {
    if (memoizedCurrentUser && movies.length > 0) {
      const pendientes = movies.filter((m) => {
        const vista = m.vistas?.find(
          (v) => v.usuario_id === memoizedCurrentUser.id && v.estado === "vista"
        );
        const rating = m.ratings?.find((r) => r.usuario_id === memoizedCurrentUser.id);
        return vista && !rating;
      });
      if (pendientes.length > 0) {
        setPendingRatings(pendientes);
        setShowReminder(true);
      } else {
        setPendingRatings([]);
        setShowReminder(false);
      }
    }
  }, [memoizedCurrentUser, movies]);

  // Suscripción a notificaciones en tiempo real
  useEffect(() => {
    if (memoizedCurrentUser?.id) {
      const channel = supabase
        .channel("notifs-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificaciones",
            filter: `usuario_id=eq.${memoizedCurrentUser.id}`,
          },
          (payload) => {
            console.log("New notification received:", payload.new);
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe((status) => {
          console.log("Notifs subscription status:", status);
        });
      return () => supabase.removeChannel(channel);
    } else {
      setNotifications([]);
    }
  }, [memoizedCurrentUser]);

  // Función para cargar todos los datos
  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      const { data: usuarios, error: userError } = await supabase
        .from("usuarios")
        .select("*, chat_habilitado")
        .order("nombre");
      if (userError) throw userError;

      const { data: peliculas, error: movieError } = await supabase
        .from("peliculas")
        .select(
          "*, vistas(*), ratings(*, usuarios(nombre)), sinopsis, duracion, director"
        )
        .order("titulo");
      if (movieError) throw movieError;

      const normalizedMovies =
        peliculas?.map((p) => ({
          ...p,
          vistas: p.vistas || [],
          ratings: p.ratings || [],
        })) || [];

      let notifs = [];
      if (memoizedCurrentUser?.id) {
        const { data: notifData, error: notifError } = await supabase
          .from("notificaciones")
          .select("*")
          .eq("usuario_id", memoizedCurrentUser.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (notifError) throw notifError;
        notifs = notifData || [];
      }

      setUsers(usuarios || []);
      setMovies(normalizedMovies);
      setNotifications(notifs);

      if (!memoizedCurrentUser && usuarios?.length > 0) {
        setCurrentUser(usuarios[0]);
      }
    } catch (err) {
      console.error("Error en fetchAll:", err);
      setError("No se pudieron cargar los datos. Por favor, intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Filtrar películas según el estado de vista del usuario actual
  const filteredMovies = movies.filter((movie) => {
    const vistaUsuario = movie.vistas?.find(
      (v) => v.usuario_id === memoizedCurrentUser?.id
    )?.estado;
    if (filter === "seen") return vistaUsuario === "vista";
    if (filter === "unseen") return vistaUsuario !== "vista";
    return true; // 'all'
  });

  // Funciones principales
  async function addMovie(payload) {
    if (!memoizedCurrentUser?.id) return false;
    try {
      const moviePayload = {
        titulo: payload.titulo,
        genero: payload.genero,
        anio: payload.anio,
        poster: payload.poster,
        agregado_por: memoizedCurrentUser.id,
        sinopsis: payload.sinopsis,
        duracion: payload.duracion,
        director: payload.director,
      };
      const { data: movieData, error: movieError } = await supabase
        .from("peliculas")
        .insert([moviePayload])
        .select(
          "*, vistas(*), ratings(*, usuarios(nombre)), sinopsis, duracion, director"
        )
        .single();
      if (movieError) throw movieError;

      let newVistas = [];
      if (payload.vistaEstado) {
        const { data: vistaData, error: vistaError } = await supabase
          .from("vistas")
          .insert([
            {
              usuario_id: memoizedCurrentUser.id,
              pelicula_id: movieData.id,
              estado: payload.vistaEstado,
            },
          ])
          .select()
          .single();
        if (vistaError) throw vistaError;
        newVistas = [vistaData];
      }

      const newMovie = { ...movieData, vistas: newVistas, ratings: [] };
      setMovies((prev) => [newMovie, ...prev]);
      return true;
    } catch (err) {
      console.error("Error al agregar película:", err);
      return false;
    }
  }

  async function toggleView(movieId, userId, estado) {
    if (!userId) return;
    try {
      const { data: vistaData, error } = await supabase
        .from("vistas")
        .upsert(
          { usuario_id: userId, pelicula_id: movieId, estado },
          { onConflict: "usuario_id,pelicula_id" }
        )
        .select()
        .single();
      if (error) throw error;

      setMovies((prev) =>
        prev.map((m) =>
          m.id === movieId
            ? {
                ...m,
                vistas: m.vistas.some((v) => v.usuario_id === userId)
                  ? m.vistas.map((v) =>
                      v.usuario_id === userId ? { ...v, estado } : v
                    )
                  : [...m.vistas, vistaData],
              }
            : m
        )
      );
    } catch (err) {
      console.error("Error al actualizar vista:", err);
    }
  }

  async function deleteMovie(movieId) {
    if (!memoizedCurrentUser?.id) return;
    try {
      const { error } = await supabase
        .from("peliculas")
        .delete()
        .eq("id", movieId)
        .eq("agregado_por", memoizedCurrentUser.id);
      if (error) throw error;
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch (err) {
      console.error("Error al eliminar película:", err);
    }
  }

  async function updateMovie(movieId, updatedMovie) {
    if (!memoizedCurrentUser?.id) return false;
    try {
      const { error } = await supabase
        .from("peliculas")
        .update({
          titulo: updatedMovie.titulo,
          genero: updatedMovie.genero,
          anio: updatedMovie.anio,
          poster: updatedMovie.poster,
          sinopsis: updatedMovie.sinopsis,
          duracion: updatedMovie.duracion,
          director: updatedMovie.director,
        })
        .eq("id", movieId)
        .eq("agregado_por", memoizedCurrentUser.id);
      if (error) throw error;
      setMovies((prev) =>
        prev.map((m) => (m.id === movieId ? { ...m, ...updatedMovie } : m))
      );
      setIsEditModalOpen(false);
      return true;
    } catch (err) {
      console.error("Error al actualizar película:", err);
      return false;
    }
  }

  async function updateRating(movieId, userId, rating) {
    if (!userId) return;
    try {
      await supabase
        .from("ratings")
        .upsert(
          { usuario_id: userId, pelicula_id: movieId, rating },
          { onConflict: "usuario_id,pelicula_id" }
        );

      const { data: allRatings } = await supabase
        .from("ratings")
        .select("*")
        .eq("pelicula_id", movieId);

      setMovies((prev) =>
        prev.map((m) =>
          m.id === movieId ? { ...m, ratings: allRatings || [] } : m
        )
      );
    } catch (err) {
      console.error("Error al actualizar rating:", err);
    }
  }

  async function markAsRead(notificationId) {
    if (!memoizedCurrentUser?.id) return;
    try {
      await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notificationId)
        .eq("usuario_id", memoizedCurrentUser.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, leida: true } : n))
      );
    } catch (err) {
      console.error("Error al marcar notificación como leída:", err);
    }
  }

  const [savingRatings, setSavingRatings] = useState({});
  const handleQuickRate = async (movieId, rating) => {
    if (!memoizedCurrentUser?.id) return;
    setSavingRatings((s) => ({ ...s, [movieId]: true }));
    try {
      await updateRating(movieId, memoizedCurrentUser.id, rating);
    } finally {
      setSavingRatings((s) => {
        const copy = { ...s };
        delete copy[movieId];
        return copy;
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando datos...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchAll}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        currentUser={memoizedCurrentUser}
        onOpenAdd={() => setIsAddModalOpen(true)}
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
            <UserStats user={memoizedCurrentUser} movies={movies} />
          </div>

          <div className="mt-4 flex gap-2 justify-center md:justify-start">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "all"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("seen")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "seen"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-600 hover:bg-green-200"
              }`}
            >
              Vistas
            </button>
            <button
              onClick={() => setFilter("unseen")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "unseen"
                  ? "bg-red-500 text-white"
                  : "bg-red-100 text-red-500 hover:bg-red-200"
              }`}
            >
              No vistas
            </button>
          </div>
        </section>

        <section className="mb-8">
          {memoizedCurrentUser ? (
            <MovieGrid
              movies={filteredMovies}
              currentUser={memoizedCurrentUser}
              toggleView={toggleView}
              onDelete={deleteMovie}
              onEdit={(movie) => {
                setMovieToEdit(movie);
                setIsEditModalOpen(true);
              }}
              updateRating={updateRating}
            />
          ) : (
            <div className="text-center py-12">
              Por favor, selecciona un usuario.
            </div>
          )}
        </section>
        <Leaderboard users={memoizedUsers} movies={movies} />
      </main>

      <AddMovieModal
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        addMovie={addMovie}
      />
      <EditMovieModal
        open={isEditModalOpen}
        setOpen={setIsEditModalOpen}
        movie={movieToEdit}
        updateMovie={updateMovie}
      />

      <RatingReminderModal
        open={showReminder}
        onClose={() => setShowReminder(false)}
        movies={pendingRatings}
        userId={memoizedCurrentUser?.id}
        updateRating={handleQuickRate}
      />

      {/* Chat panel siempre renderizado, pero condicionalmente visible */}
      <ChatPanel currentUser={memoizedCurrentUser} users={memoizedUsers} />
    </div>
  );
}
