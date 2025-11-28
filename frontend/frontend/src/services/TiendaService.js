// src/services/TiendaService.js (VERSIÓN DEFINITIVA Y CORREGIDA)

const API_URL = "http://localhost:8080/api/tiendas";

// Obtener todas las tiendas
export const getTiendas = async () => {
  const response = await fetch(API_URL);

  // Manejo de errores simplificado para que el componente lo atrape
  if (!response.ok) {
    throw new Error(`Error al obtener tiendas: ${response.status}`);
  }
  return response.json();
};

// Crear una tienda
export const crearTienda = async (tienda) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tienda),
  });

  if (!response.ok) {
    let errorText = await response.text();
    throw new Error(`Error al crear tienda: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Obtener tienda por ID
export const getTiendaById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener tienda por ID: ${response.status}`);
  }
  return response.json();
};

// Actualizar tienda
export const actualizarTienda = async (id, tienda) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tienda),
    });

    if (!response.ok) {
        let errorText = await response.text();
        throw new Error(`Error al actualizar tienda: ${response.status} - ${errorText}`);
    }
    return response.json();
};

// Eliminar tienda
export const eliminarTienda = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Error al eliminar tienda: ${response.status}`);
  }
  // No devuelve JSON, solo status 204 (No Content)
  return true; 
};
