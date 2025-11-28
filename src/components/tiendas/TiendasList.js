// src/components/tiendas/TiendasList.js (DISEÑO MEJORADO)

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTiendas, eliminarTienda as eliminarTiendaService } from "../../services/TiendaService";

export default function TiendasList() {
    const [tiendas, setTiendas] = useState([]);

    useEffect(() => {
        obtenerTiendas();
    }, []);

    const obtenerTiendas = async () => {
        try {
            const data = await getTiendas(); 
            setTiendas(data);
        } catch (error) {
            console.error("Error al cargar las tiendas:", error);
            alert("No se pudieron cargar las tiendas. Revisa la consola del navegador.");
        }
    };

    const eliminarTiendaLocal = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta tienda?")) return;

        try {
            await eliminarTiendaService(id);
            alert("Tienda eliminada con éxito.");
            obtenerTiendas();
        } catch (error) {
            console.error("Error al eliminar tienda:", error);
            alert(`FALLO: No se pudo eliminar la tienda. ${error.message || ''}. Revisa la consola del Backend.`);
        }
    };

    return (
        <div className="container mt-5">
            {/* 1. Encabezado con título y botón separados */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-primary mb-0">Gestión de Tiendas</h2>
                <Link 
                    to="/tiendas/new" 
                    className="btn btn-success btn-lg shadow-sm" // Sombra y tamaño grande
                >
                    + Agregar Tienda
                </Link>
            </div>
            
            {/* 2. Contenedor principal con diseño de tarjeta y sombra */}
            <div className="card shadow-sm border-0">
                {/* 3. Encabezado de la tarjeta (opcional) */}
                <div className="card-header bg-light">
                    <h5 className="mb-0 text-muted">Inventario de Tiendas Registradas</h5>
                </div>
                
                {/* 4. Cuerpo de la tarjeta, que contiene la tabla */}
                <div className="card-body p-0">
                    <table className="table table-striped table-hover mb-0"> {/* Usamos table-hover */}
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Dirección</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tiendas.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-3">No hay tiendas registradas.</td>
                                </tr>
                            ) : (
                                tiendas.map((t) => (
                                    <tr key={t.id}>
                                        <td>{t.id}</td>
                                        <td>{t.nombre}</td>
                                        <td>{t.direccion}</td>
                                        <td>
                                            <Link
                                                to={`/tiendas/edit/${t.id}`}
                                                className="btn btn-warning btn-sm me-2"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => eliminarTiendaLocal(t.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}