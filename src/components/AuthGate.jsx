import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Ajustá el path si es necesario

export default function AuthGate({ children }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Verificar si hay una sesión persistente en localStorage
    const storedUser = JSON.parse(localStorage.getItem("authUser"));
    if (storedUser) {
      setSelectedUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Buscar usuario en Supabase por PIN
      const { data: users, error: fetchError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("pin", pin)
        .single(); // Asume un PIN único por usuario

      if (fetchError || !users) {
        setError("PIN incorrecto. Por favor, intentá de nuevo.");
        setPin("");
        return;
      }

      // Autenticar y preseleccionar el usuario
      setSelectedUser(users);
      setIsAuthenticated(true);
      setError("");

      // Guardar en localStorage para sesión persistente
      localStorage.setItem("authUser", JSON.stringify(users));
    } catch (err) {
      console.error("Error al validar PIN:", err);
      setError("Hubo un error al validar el PIN. Intentá de nuevo.");
      setPin("");
    }
  };

  if (isAuthenticated) {
    // Pasar el usuario preseleccionado a los children (App.jsx)
    return React.cloneElement(children, { preselectedUser: selectedUser });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Los Pibes Cinéfilos</h2>
        <p className="text-center text-gray-600 mb-6">Ingresá tu PIN para acceder</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
              PIN
            </label>
            <input
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Ej: 1234"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
