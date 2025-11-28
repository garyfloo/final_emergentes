// src/components/tiendas/RegistrarTienda.js (DISEÑO MEJORADO)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearTienda } from "../../services/TiendaService"; 

export default function RegistrarTienda() {
    const [nombre, setNombre] = useState("");
    const [direccion, setDireccion] = useState("");

    const navigate = useNavigate();

    const guardarTienda = async (e) => {
        e.preventDefault();

        const nuevaTienda = { nombre, direccion };

        try {
            await crearTienda(nuevaTienda);
            alert("Tienda registrada con éxito!");
            navigate("/tiendas");
        } catch (error) {
            console.error("Error al guardar la tienda:", error);
            alert(`FALLO: No se pudo guardar la tienda. ${error.message}. Revisa la consola del Backend.`);
        }
    };

    return (
        <div className="container mt-5">
            {/* 1. Contenedor centrado y tarjeta con sombra grande */}
            <div className="card p-4 shadow-lg mx-auto border-0" style={{ maxWidth: '550px' }}>
                <h2 className="card-title text-center text-primary mb-4">
                    Registrar Nueva Tienda
                </h2>

                <form onSubmit={guardarTienda}>
                    
                    {/* Input para Nombre */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Nombre</label>
                        <input
                            type="text"
                            className="form-control"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>

                    {/* Input para Dirección */}
                    <div className="mb-4">
                        <label className="form-label fw-bold">Dirección</label>
                        <input
                            type="text"
                            className="form-control"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            required
                        />
                    </div>

                    {/* Botón de Guardar que ocupa todo el ancho */}
                    <button type="submit" className="btn btn-primary btn-lg w-100">
                        Guardar Registro
                    </button>
                </form>
            </div>
        </div>
    );
}