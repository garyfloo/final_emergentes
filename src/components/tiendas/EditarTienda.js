// src/components/tiendas/EditarTienda.js (CORREGIDO CON MANEJO DE ERRORES)

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTiendaById, actualizarTienda } from "../../services/TiendaService"; 

export default function EditarTienda() {
  const { id } = useParams();

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    cargarTienda();
  }, [id]); // 👈 Dependencia 'id' agregada para buenas prácticas de React

  const cargarTienda = async () => {
    try {
        const data = await getTiendaById(id);
        setNombre(data.nombre);
        setDireccion(data.direccion);
    } catch (error) {
        console.error("Error al cargar tienda:", error);
        alert("No se pudo cargar la tienda. Verifique el ID.");
    }
  };

  const guardarActualizacion = async (e) => {
    e.preventDefault();

    const tiendaActualizada = { nombre, direccion };

    try {
        // CORRECCIÓN: Usamos la función del servicio
        await actualizarTienda(id, tiendaActualizada); 
        alert("Tienda actualizada con éxito!"); // 👈 Notificación de éxito
        navigate("/tiendas");
    } catch (error) {
        // 👈 Capturamos el error si el servidor falla (ej: 404 o 500)
        console.error("Error al actualizar tienda:", error);
        alert(`FALLO: No se pudo actualizar la tienda. Verifique la consola del Backend. ${error.message || ''}`);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Editar Tienda</h2>

      <form onSubmit={guardarActualizacion} className="mt-3">
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Dirección</label>
          <input
            type="text"
            className="form-control"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">Actualizar</button>
      </form>
    </div>
  );
}
