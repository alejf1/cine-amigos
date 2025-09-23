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
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  // ← NUEVOS ESTADOS PARA FILTROS SIMPLES
  const [sortMode, setSortMode] = useState("default"); // "default" o "topRated"
  const [viewStatus, setViewStatus] = useState("all"); // "all", "vista", "no_vista"

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Usuario de auth:", user?.id);

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
        .select(
          `
          *,
          vistas(*),
          ratings (
            *,
            usuarios (nombre)
          )
        `
        )
        .order("titulo");
      const normalized =
        peliculas?.map((p) => ({
          ...p,
          vistas: p.vistas || [],
          ratings: p.ratings || [],
        })) || [];
      setUsers(usuarios || []);
      setMovies(normalized);

      if (user && usuarios) {
        const authUser = usuarios.find((u) => u.id === user.id);
        console.log(
          "Usuario autenticado encontrado:",
          authUser?.nombre,
          authUser?.id
        );
        setCurrentUser(authUser || usuarios[0] || null);
      } else {
        console.log("No hay usuario autenticado, usando primero de la lista");
        setCurrentUser(usuarios?.[0] || null);
      }
      console.log("Usuario actual final:", currentUser?.id);
      console.log("Películas cargadas:", normalized.length);
    } catch (error) {
      console.error("Error en fetchAll:", error);
    }
  }

  async function addMovie(payload) {
    try {
      const moviePayload = {
        titulo: payload.titulo,
        genero: payload.genero,
        anio: payload.anio,
        poster: payload.poster,
        agregado_por: currentUser?.id || users[0]?.id, // Fallback si no hay currentUser
      };

      const { data, error } = await supabase
        .from("peliculas")
        .insert([moviePayload])
        .select("*, vistas(*)");
      if (error) {
        console.error("Error al agregar película:", error);
        return false;
      }
      if (!data?.[0]) return false;

      const newMovie = { ...data[0], vistas: data[0].vistas || [] };
      setMovies((prev) => [...prev, newMovie]);
      return true;
    } catch (error) {
      console.error("Error en addMovie:", error);
      return false;
    }
  }

  async function toggleView(movieId, userId, estado) {
    if (!movieId || !userId) {
      console.error("IDs faltantes:", { movieId, userId });
      alert("Error: IDs faltantes");
      return;
    }
    try {
      setMovies((prev) =>
        prev.map((m) => {
          if (m.id !== movieId) return m;
          const vistaExistente = (m.vistas || []).find(
            (v) => v.usuario_id === userId
          );
          let vistasActualizadas;
          if (vistaExistente) {
            vistasActualizadas = m.vistas.map((v) =>
              v.usuario_id === userId ? { ...v, estado } : v
            );
          } else {
            vistasActualizadas = [
              ...(m.vistas || []),
              { usuario_id: userId, estado, pelicula_id: movieId },
            ];
          }
          return { ...m, vistas: vistasActualizadas };
        })
      );
      const { error } = await supabase
        .from("vistas")
        .upsert(
          [{ usuario_id: userId, pelicula_id: movieId, estado }],
          { onConflict: "usuario_id,pelicula_id" }
        );
      if (error) {
        console.error("Error en Supabase upsert:", error);
        throw error;
      }
      console.log("Vista actualizada correctamente en DB");
    } catch (error) {
      console.error("Error en toggleView:", error);
      fetchAll();
      alert("Error al actualizar el estado. Inténtalo de nuevo.");
    }
  }

  async function deleteMovie(movieId) {
    try {
      const pelicula = movies.find((m) => m.id === movieId);
      if (!pelicula) return;
      if (pelicula.agregado_por !== currentUser?.id) {
        alert("Solo quien agregó la película puede eliminarla.");
        return;
      }
      const { error } = await supabase
        .from("peliculas")
        .delete()
        .eq("id", movieId);
      if (!error) {
        setMovies((prev) => prev.filter((m) => m.id !== movieId));
        console.log("Película eliminada correctamente");
      } else {
        console.error("Error al eliminar película:", error);
        alert("Error al eliminar la película");
      }
    } catch (error) {
      console.error("Error en deleteMovie:", error);
      alert("Error al eliminar la película");
    }
  }

  const handleEditMovie = (movie) => {
    setEditingMovie(movie);
    setOpenEdit(true);
  };

  async function updateMovie(movieId, updatedData) {
    try {
      const pelicula = movies.find((m) => m.id === movieId);
      if (!pelicula || pelicula.agregado_por !== currentUser?.id) {
        alert("Solo quien agregó la película puede editarla.");
        return false;
      }
      const { data, error } = await supabase
        .from("peliculas")
        .update(updatedData)
        .eq("id", movieId)
        .select("*, vistas(*)");
      if (!error && data?.[0]) {
        setMovies((prev) =>
          prev.map((movie) =>
            movie.id === movieId
              ? { ...data[0], vistas: data[0].vistas || [] }
              : movie
          )
        );
        console.log("Película actualizada correctamente");
        return true;
      }
      console.error("Error al actualizar película:", error);
      return false;
    } catch (error) {
      console.error("Error en updateMovie:", error);
      return false;
    }
  }

  async function updateRating(movieId, userId, rating) {
    try {
      const { data: existingRating, error: findError } = await supabase
        .from("ratings")
        .select("id")
        .eq("pelicula_id", movieId)
        .eq("usuario_id", userId)
        .single();
      if (findError && findError.code !== "PGRST116") throw findError;

      let result;
      if (existingRating) {
        const { data, error } = await supabase
          .from("ratings")
          .update({ rating, updated_at: new Date().toISOString() })
          .eq("id", existingRating.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("ratings")
          .insert({
            pelicula_id: movieId,
            usuario_id: userId,
            rating,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      setMovies((prev) =>
        prev.map((movie) =>
          movie.id === movieId
            ? {
                ...movie,
                ratings: movie.ratings?.find((r) => r.usuario_id === userId)
                  ? movie.ratings.map((r) =>
                      r.usuario_id === userId ? { ...r, rating } : r
                    )
                  : [
                      ...(movie.ratings || []),
                      {
                        id: result.id || Date.now(),
                        usuario_id: userId,
                        rating,
                        created_at: new Date().toISOString(),
                      },
                    ],
              }
            : movie
        )
      );
      console.log("Rating actualizado correctamente:", result);
    } catch (error) {
      console.error("Error updating rating:", error);
      fetchAll();
      alert("Error al guardar la calificación. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        users={users}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenAdd={() => setOpenAdd(true)}
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

          {/* ← NUEVOS FILTROS SIMPLES */}
          <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start mt-4 bg-white p-3 rounded-lg shadow-sm">
            {/* Filtro de ordenamiento */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="default">Orden predeterminado</option>
              <option value="topRated">⭐ Más valoradas</option>
            </select>

            {/* Filtro de estado de vista */}
            <select
              value={viewStatus}
              onChange={(e) => setViewStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="vista">Vistas</option>
              <option value="no_vista">No vistas</option>
            </select>

            {/* Botón limpiar filtros (solo si hay filtros activos) */}
            {(sortMode !== "default" || viewStatus !== "all") && (
              <button
                onClick={() => {
                  setSortMode("default");
                  setViewStatus("all");
                }}
                className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1 transition-colors"
              >
                <span className="text-xs">🗑️</span>
                Limpiar
              </button>
            )}
          </div>
        </section>

        <section className="mb-8">
          {currentUser ? (
            <MovieGrid
              movies={movies}
              currentUser={currentUser}
              toggleView={toggleView}
              onDelete={deleteMovie}
              onEdit={handleEditMovie}
              updateRating={updateRating}
              sortMode={sortMode}      // ← CORREGIDO
              viewStatus={viewStatus}  // ← CORREGIDO
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando usuario...</p>
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
