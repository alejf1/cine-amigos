import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";
import AddMovieModal from "./components/AddMovieModal";
import UserStats from "./components/UserStats";
import Leaderboard from "./components/Leaderboard";

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);

  useEffect(() => {
    fetchAll();
    // Opcional: subscribir a cambios con supabase.realtime
  }, []);

  async function fetchAll() {
    const { data: usuarios } = await supabase.from("usuarios").select("*").order("nombre");
    const { data: peliculas } = await supabase
      .from("peliculas")
      .select("*, vistas(*)")
      .order("titulo");

    // Asegurar que cada pelicula tenga vistas array (si null)
    const normalized = peliculas?.map(p => ({ ...p, vistas: p.vistas || [] })) || [];

    setUsers(usuarios || []);
    setMovies(normalized);
    setCurrentUser((usuarios && usuarios[0]) || null);
  }

  async function addMovie(payload) {
    // payload: { titulo, genero, anio, plataforma, descripcion, poster }
    const insert = { ...payload, agregado_por: currentUser.id };
    const { data, error } = await supabase
      .from("peliculas")
      .insert([insert])
      .select("*, vistas(*)");

    if (!error && data?.[0]) {
      setMovies(prev => [...prev, { ...data[0], vistas: data[0].vistas || [] }]);
      return true;
    }
    return false;
  }

  async function toggleView(movieId, userId, estado) {
    // upsert vista
    const { data, error } = await supabase
      .from("vistas")
      .upsert([{ usuario_id: userId, pelicula_id: movieId, estado }], {
        onConflict: "usuario_id,pelicula_id"
      })
      .select();

    if (!error) {
      // actualizar estado localmente
      setMovies(prev => prev.map(m => {
        if (m.id !== movieId) return m;
        // si ya existía la vista, actualizar; si no, agregar
        const exists = (m.vistas || []).some(v => v.usuario_id === userId);
        let vistas = m.vistas || [];
        if (exists) {
          vistas = vistas.map(v => v.usuario_id === userId ? { ...v, estado } : v);
        } else {
          vistas = [...vistas, { usuario_id: userId, estado }];
        }
        return { ...m, vistas };
      }));
    }
  }

  async function deleteMovie(movieId) {
    // borrar solo si currentUser es el que agregó
    const pelicula = movies.find(m => m.id === movieId);
    if (!pelicula) return;
    if (pelicula.agregado_por !== currentUser.id) {
      alert("Solo quien agregó la película puede eliminarla.");
      return;
    }
    const { error } = await supabase.from("peliculas").delete().eq("id", movieId);
    if (!error) {
      setMovies(prev => prev.filter(m => m.id !== movieId));
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
              <p className="text-sm text-gray-500">Explorá las recomendaciones de tus amigos.</p>
            </div>
            <div className="flex items-center gap-4">
              <UserStats user={currentUser} movies={movies} />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <MovieGrid
            movies={movies}
            currentUser={currentUser}
            toggleView={toggleView}
            onDelete={deleteMovie}
          />
        </section>

        <section>
          <Leaderboard users={users} movies={movies} />
        </section>
      </main>

      <AddMovieModal open={openAdd} setOpen={setOpenAdd} addMovie={addMovie} />
    </div>
  );
}
