import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";
import AddMovieModal from "./components/AddMovieModal";
import EditMovieModal from "./components/EditMovieModal"; // ← NUEVO IMPORT
import UserStats from "./components/UserStats";
import Leaderboard from "./components/Leaderboard";

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false); // ← NUEVO ESTADO
  const [editingMovie, setEditingMovie] = useState(null); // ← NUEVO ESTADO
  
  // ← NUEVOS ESTADOS PARA FILTROS
  const [sortMode, setSortMode] = useState("default");
  const [filters, setFilters] = useState({
    viewStatus: "all", // "all", "vista", "no_vista"
    genres: [], // Array de géneros seleccionados
    yearFrom: "",
    yearTo: "",
    myMovies: false,
    unrated: false,
  });

  useEffect(() => {
    fetchAll();
    // Opcional: subscribir a cambios con supabase.realtime
  }, []);

  // ← FUNCIÓN PARA ACTUALIZAR FILTROS
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ← FUNCIÓN PARA LIMPIAR FILTROS
  const clearFilters = () => {
    setFilters({
      viewStatus: "all",
      genres: [],
      yearFrom: "",
      yearTo: "",
      myMovies: false,
      unrated: false,
    });
    setSortMode("default");
  };

  // ← HELPER PARA OBTENER GÉNEROS ÚNICOS
  const getUniqueGenres = (movies) => {
    const genres = new Set();
    movies.forEach(movie => {
      if (movie.genero) {
        genres.add(movie.genero);
      }
    });
    return Array.from(genres).sort();
  };

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
      // ← CORRECCIÓN: Filtrar el payload para peliculas (sin vistaEstado)
      const moviePayload = {
        titulo: payload.titulo,
        genero: payload.genero,
        anio: payload.anio,
        poster: payload.poster,
        agregado_por: currentUser.id
      };
     
      // 1. Insertar la película
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
     
      // 2. Si hay vistaEstado, crear entrada en vistas automáticamente
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
          // No fallar la película por esto, solo log
        } else {
          // Actualizar el estado local con la vista
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
     
      // 3. Agregar al estado local
      setMovies((prev) => [...prev, newMovie]);
      return true;
    } catch (error) {
      console.error("Error en addMovie:", error);
      return false;
    }
  }

  async function toggleView(movieId, userId, estado) {
    console.log("toggleView llamado:", {
      movieId,
      userId,
      estado,
      currentUserId: currentUser?.id,
    });
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
              {
                usuario_id: userId,
                estado,
                pelicula_id: movieId,
              },
            ];
          }
          return { ...m, vistas: vistasActualizadas };
        })
      );
      const { error } = await supabase.from("vistas").upsert(
        [
          {
            usuario_id: userId,
            pelicula_id: movieId,
            estado,
          },
        ],
        {
          onConflict: "usuario_id,pelicula_id",
        }
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
      if (pelicula.agregado_por !== currentUser.id) {
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
      if (!pelicula || pelicula.agregado_por !== currentUser.id) {
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
      // 1. Verificar si ya existe un rating para esta película/usuario
      const { data: existingRating, error: findError } = await supabase
        .from('ratings')
        .select('id')
        .eq('pelicula_id', movieId)
        .eq('usuario_id', userId)
        .single();
      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw findError;
      }
      let result;
      if (existingRating) {
        // 2. Actualizar rating existente
        const { data, error } = await supabase
          .from('ratings')
          .update({
            rating,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id)
          .select()
          .single();
       
        if (error) throw error;
        result = data;
      } else {
        // 3. Crear nuevo rating
        const { data, error } = await supabase
          .from('ratings')
          .insert({
            pelicula_id: movieId,
            usuario_id: userId,
            rating: rating,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
       
        if (error) throw error;
        result = data;
      }
      // 4. Actualizar el estado local (optimistic update)
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
                        id: result.id || Date.now(), // Usar el ID real de Supabase si existe
                        usuario_id: userId,
                        rating,
                        created_at: new Date().toISOString(),
                      },
                    ],
              }
            : movie
        )
      );
      console.log('Rating actualizado correctamente:', result);
    } catch (error) {
      console.error('Error updating rating:', error);
      // Si falla, recargar datos para revertir el cambio
      fetchAll();
      alert('Error al guardar la calificación. Inténtalo de nuevo.');
    }
  }

  // ← CALCULAR filteredMovies DENTRO DE App.jsx
  const filteredMovies = movies.filter(movie => {
    const { viewStatus, genres, yearFrom, yearTo, myMovies, unrated } = filters;

    // Filtro por estado de vista del usuario actual
    if (viewStatus !== "all") {
      const userView = movie.vistas?.find(v => v.usuario_id === currentUser?.id)?.estado;
      if (viewStatus === "vista" && userView !== "vista") return false;
      if (viewStatus === "no_vista" && userView !== "no vista") return false;
    }

    // Filtro por género (case insensitive)
    if (genres.length > 0 && movie.genero) {
      if (!genres.some(genre => 
        movie.genero.toLowerCase().includes(genre.toLowerCase())
      )) {
        return false;
      }
    }

    // Filtro por año
    if (yearFrom && movie.anio && movie.anio < parseInt(yearFrom)) return false;
    if (yearTo && movie.anio && movie.anio > parseInt(yearTo)) return false;

    // Filtro por mis películas
    if (myMovies && movie.agregado_por !== currentUser?.id) return false;

    // Filtro por sin calificar
    if (unrated && movie.ratings && movie.ratings.length > 0) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        users={users}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenAdd={() => setOpenAdd(true)}
        sortMode={sortMode}
        setSortMode={setSortMode}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* ← SECCIÓN DE FILTROS */}
        <section className="mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end lg:gap-4">
              <h2 className="text-lg font-semibold mb-3 lg:mb-0">Filtros</h2>
              
              {/* Contador de filtros activos */}
              {Object.values(filters).some(v => v !== (Array.isArray(v) ? [] : false)) && (
                <span className="text-sm text-gray-500 lg:ml-auto">
                  {Object.values(filters).filter(v => v !== (Array.isArray(v) ? [] : false)).length} filtro activo
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Filtro de estado de vista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mi estado</label>
                <select
                  value={filters.viewStatus}
                  onChange={(e) => updateFilter("viewStatus", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="vista">Mis vistas</option>
                  <option value="no_vista">Mis no vistas</option>
                </select>
              </div>

              {/* Filtro de género */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Géneros</label>
                <select
                  multiple
                  value={filters.genres}
                  onChange={(e) => updateFilter("genres", Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ height: '40px' }} // Altura fija para que no se expanda
                >
                  {getUniqueGenres(movies).map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                {filters.genres.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{filters.genres.length} género{filters.genres.length !== 1 ? 's' : ''} seleccionado{filters.genres.length !== 1 ? 's' : ''}</p>
                )}
              </div>

              {/* Filtro de año */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Desde"
                    value={filters.yearFrom}
                    onChange={(e) => updateFilter("yearFrom", e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                  <input
                    type="number"
                    placeholder="Hasta"
                    value={filters.yearTo}
                    onChange={(e) => updateFilter("yearTo", e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.myMovies}
                    onChange={(e) => updateFilter("myMovies", e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Solo mías</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.unrated}
                    onChange={(e) => updateFilter("unrated", e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Sin calificar</span>
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={clearFilters}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  Object.values(filters).some(v => v !== (Array.isArray(v) ? [] : false))
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!Object.values(filters).some(v => v !== (Array.isArray(v) ? [] : false))}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </section>

        {/* ← CONTADOR DE RESULTADOS */}
        <div className="mb-4 text-right">
          <span className="text-sm text-gray-600">
            Mostrando {filteredMovies.length} de {movies.length} películas
          </span>
        </div>

        <section className="mb-8">
          {currentUser ? (
            <MovieGrid
              movies={movies}
              currentUser={currentUser}
              toggleView={toggleView}
              onDelete={deleteMovie}
              onEdit={handleEditMovie}
              updateRating={updateRating}
              users={users}
              sortMode={sortMode}
              filters={filters} // ← PASAR FILTROS
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

// ← FUNCIÓN HELPER MOVIDA AFUERA DEL COMPONENTE
function getUniqueGenres(movies) {
  const genres = new Set();
  movies.forEach(movie => {
    if (movie.genero) {
      genres.add(movie.genero);
    }
  });
  return Array.from(genres).sort();
}
