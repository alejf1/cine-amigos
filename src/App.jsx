// App.jsx
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

  async function addMovie(payload) {
    try {
      if (!currentUser?.id) {
        console.error("No hay usuario seleccionado");
        alert("Por favor, selecciona un usuario antes de agregar una película");
        return false;
      }

      const moviePayload = {
        titulo: payload.titulo,
        genero: payload.genero,
        anio: payload.anio,
        poster: payload.poster,
        agregado_por: currentUser.id
      };
      
      const { data, error } = await supabase
        .from("peliculas")
        .insert([moviePayload])
        .select("*, vistas(*)");
      
      if (error) {
        console.error("Error al agregar película:", error);
        return false;
      }
      
      if (!data?.[0]) {
        return false;
      }
      
      const newMovieId = data[0].id;
      const newMovie = { ...data[0], vistas: data[0].vistas || [] };
      
      if (payload.vistaEstado) {
        const { error: vistaError } = await supabase
          .from("vistas")
          .insert([{
            usuario_id: currentUser.id,
            pelicula_id: newMovieId,
            estado: payload.vistaEstado
          }]);
        
        if (vistaError) {
          console.error("Error al agregar vista:", vistaError);
        } else {
          newMovie.vistas = [
            ...newMovie.vistas,
            {
              usuario_id: currentUser.id,
              pelicula_id: newMovieId,
              estado: payload.vistaEstado
            }
          ];
        }
      }
      
      setMovies((prev) => [...prev, newMovie]);
      return true;
    } catch (error) {
      console.error("Error en addMovie:", error);
      return false;
    }
  }

  async function markAsRead(notifId) {
    try {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notifId);
      if (error) throw error;
      setNotifications((prev) => prev.map(n => n.id === notifId ? { ...n, leida: true } : n));
      console.log("Notificación marcada como leída:", notifId);
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  }

  async function toggleView(movieId, userId, estado) {  // ← Agrega userId como parámetro
  try {
    if (!userId) {  // ← Usa userId en lugar de currentUser.id
      console.error("No hay usuario seleccionado");
      return;
    }
    const { error } = await supabase
      .from("vistas")
      .upsert(
        { usuario_id: userId, pelicula_id: movieId, estado },  // ← Usa userId
        { onConflict: "usuario_id,pelicula_id" }
      );
    if (error) throw error;
    setMovies((prev) =>
      prev.map((m) =>
        m.id === movieId
          ? {
              ...m,
              vistas: m.vistas.map((v) =>
                v.usuario_id === userId ? { ...v, estado } : v  // ← Usa userId
              ),
            }
          : m
      )
    );
  } catch (error) {
    console.error("Error al actualizar vista:", error);
  }
}

  async function deleteMovie(movieId) {
    try {
      if (!currentUser?.id) {
        console.error("No hay usuario seleccionado");
        return;
      }
      const { error } = await supabase
        .from("peliculas")
        .delete()
        .eq("id", movieId)
        .eq("agregado_por", currentUser.id);
      if (error) throw error;
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch (error) {
      console.error("Error al eliminar película:", error);
    }
  }

  async function handleEditMovie(movie) {
    setEditingMovie(movie);
    setOpenEdit(true);
  }

  async function updateMovie(updatedMovie) {
    try {
      if (!currentUser?.id) {
        console.error("No hay usuario seleccionado");
        return false;
      }
      const { error } = await supabase
        .from("peliculas")
        .update({
          titulo: updatedMovie.titulo,
          genero: updatedMovie.genero,
          anio: updatedMovie.anio,
          poster: updatedMovie.poster,
        })
        .eq("id", updatedMovie.id)
        .eq("agregado_por", currentUser.id);
      if (error) throw error;
      setMovies((prev) =>
        prev.map((m) =>
          m.id === updatedMovie.id ? { ...m, ...updatedMovie } : m
        )
      );
      setOpenEdit(false);
      return true;
    } catch (error) {
      console.error("Error al actualizar película:", error);
      return false;
    }
  }

  async function updateRating(movieId, userId, rating) {  // ← Agrega userId como parámetro
  try {
    if (!userId) {  // ← Usa userId en lugar de currentUser.id
      console.error("No hay usuario seleccionado");
      return;
    }
    const { error } = await supabase
      .from("ratings")
      .upsert(
        { usuario_id: userId, pelicula_id: movieId, rating },  // ← Usa rating como entero
        { onConflict: "usuario_id,pelicula_id" }
      );
    if (error) throw error;
    setMovies((prev) =>
      prev.map((m) =>
        m.id === movieId
          ? {
              ...m,
              ratings: m.ratings.map((r) =>
                r.usuario_id === userId ? { ...r, rating } : r  // ← Usa userId
              ),
            }
          : m
      )
    );
  } catch (error) {
    console.error("Error al actualizar rating:", error);
    alert('Hubo un error al guardar tu calificación. Intentá de nuevo.');  // ← Agrega alerta para el usuario
  }
}

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
        <section className="mb-8">
          {currentUser ? (
            <MovieGrid
              movies={movies}
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
