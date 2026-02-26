import { useState, useEffect } from "react"; // ← solo una vez, ambos hooks
import MovieCard from "./MovieCard";

export default function MovieGrid({
  movies,
  currentUser,
  toggleView,
  onDelete,
  onEdit,
  updateRating,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 12;

  // Resetear a página 1 cada vez que cambie la lista de películas (filtro/búsqueda)
  useEffect(() => {
    setCurrentPage(1);
  }, [movies]); // ← importante: dependencia en movies

  // Sort: no vistas primero, luego por cantidad de vistas ascendente
  const sorted = [...movies].sort((a, b) => {
    const aCount = (a.vistas || []).filter((v) => v.estado === "vista").length;
    const bCount = (b.vistas || []).filter((v) => v.estado === "vista").length;

    if (aCount === 0 && bCount !== 0) return -1;
    if (bCount === 0 && aCount !== 0) return 1;
    return aCount - bCount;
  });

  // Paginación
  const totalMovies = sorted.length;
  const totalPages = Math.ceil(totalMovies / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const paginatedMovies = sorted.slice(startIndex, endIndex);

  const goToPage = (page) => {
    const newPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(newPage);

    const mainElement = document.getElementById("main-content");
    if (mainElement) {
      const offset = 80;
      const elementPosition =
        mainElement.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  const getVisiblePages = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div id="movie-grid">
      {paginatedMovies.length === 0 && movies.length > 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay películas para mostrar en esta página (quizás por filtro o
          búsqueda)
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {paginatedMovies.map((m) => (
            <MovieCard
              key={m.id}
              movie={m}
              currentUser={currentUser}
              toggleView={toggleView}
              onDelete={onDelete}
              onEdit={onEdit}
              updateRating={updateRating}
            />
          ))}
        </div>
      )}

      {/* Controles de paginación */}
      {totalMovies > moviesPerPage && (
        <div className="mt-6 flex justify-center items-center gap-2 flex-wrap">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Página anterior"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex gap-1">
            {getVisiblePages().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                aria-label={`Página ${page}`}
              >
                {page}
              </button>
            ))}
            {totalPages > 3 && currentPage < totalPages - 1 && (
              <span className="px-3 py-1 text-sm font-medium flex items-center justify-center">
                ...
              </span>
            )}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-md text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Página siguiente"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
