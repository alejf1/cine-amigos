import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";
import AddMovieModal from "./components/AddMovieModal";
import EditMovieModal from "./components/EditMovieModal";
import UserStats from "./components/UserStats";
import Leaderboard from "./components/Leaderboard";

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
  const [filter, setFilter] = useState("all"); // Nuevo estado para el filtro: 'all', 'seen', 'unseen'

  // Carga inicial
  useEffect(() => {
    fetchAll();
  }, []);

  // Suscripción a notificaciones en tiempo real
  useEffect(() => {
    if (currentUser?.id) {
      const channel = supabase
        .channel("notifs-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificaciones",
            filter: `usuario_id=eq.${currentUser.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  // Función para cargar todos los datos
  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      const { data: usuarios, error: userError } = await supabase
        .from("usuarios")
        .select("*")
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
      if (currentUser?.id) {
        const { data: notifData, error: notifError } = await supabase
          .from("notificaciones")
          .select("*")
          .eq("usuario_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (notifError) throw notifError;
        notifs = notifData || [];
      }

      setUsers(usuarios || []);
      setMovies(normalizedMovies);
      setNotifications(notifs);

      if (!currentUser && usuarios?.length > 0) {
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
      (v) => v.usuario_id === currentUser?.id
    )?.estado;
    if (filter === "seen") return vistaUsuario === "vista";
    if (filter === "unseen") return vistaUsuario !== "vista";
    return true; // 'all'
  });

  // Funciones principales
  async function addMovie(payload) {
    if (!currentUser?.id) return false;
    try {
      const moviePayload = {
        titulo: payload.titulo,
        genero: payload.genero,
        anio: payload.anio,
        poster: payload.poster,
        agregado_por: currentUser.id,
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
              usuario_id: currentUser.id,
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
    if (!currentUser?.id) return;
    try {
      const { error } = await supabase
        .from("peliculas")
        .delete()
        .eq("id", movieId)
        .eq("agregado_por", currentUser.id);
      if (error) throw error;
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch (err) {
      console.error("Error al eliminar película:", err);
    }
  }

  async function updateMovie(movieId, updatedMovie) {
    if (!currentUser?.id) return false;
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
        .eq("agregado_por", currentUser.id);
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
    if (!currentUser?.id) return;
    try {
      await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notificationId)
        .eq("usuario_id", currentUser.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, leida: true } : n))
      );
    } catch (err) {
      console.error("Error al marcar notificación como leída:", err);
    }
  }

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
        currentUser={currentUser}
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
            <UserStats user={currentUser} movies={movies} />
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
          {currentUser ? (
            <MovieGrid
              movies={filteredMovies}
              currentUser={currentUser}
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
        <Leaderboard users={users} movies={movies} />
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
    </div>
  );
}
