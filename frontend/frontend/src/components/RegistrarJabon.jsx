// RegistrarJabon.jsx (CORRECCIÓN FINAL DE MAPEO)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import JabonService from "../services/JabonService";

export default function RegistrarJabon() {

    const navigate = useNavigate();

    // 🎯 Estado inicial: Ahora solo tiene los campos que Java espera (eliminado 'color')
    const [jabon, setJabon] = useState({
        nombre: "",
        fragancia: "", // Ahora el estado se llama FRAGANCIA, no 'color'
        precio: 0,
        marca: "",
        
        // ¡CAMPOS FALTANTES AÑADIDOS!
        stock: 0, 
        tipo: ""
    });

    const handleChange = (e) => {
        // Asegura que los números se envíen como números (importante para precio y stock)
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        
        setJabon({
            ...jabon,
            [e.target.name]: value
        });
    };

    const guardar = (e) => {
        e.preventDefault();

        JabonService.createJabon(jabon)
            .then(() => {
                alert("Jabón registrado con éxito");
                navigate("/jabones");
            })
            .catch((err) => {
                // Muestra un error más específico en la consola del navegador
                console.error("Error al crear jabón. Revisa la respuesta del Backend:", err.response || err);
                alert("Ocurrió un error al guardar el jabón. Por favor, verifica la consola del Backend (Java) para ver el error de la base de datos.");
            });
    };

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="card shadow p-4" style={{ width: "30rem" }}>
                <h3 className="text-center mb-4">Registrar Jabón</h3>

                <form onSubmit={guardar}>
                    
                    {/* Nombre */}
                    <div className="mb-3">
                        <label className="form-label">Nombre</label>
                        <input name="nombre" className="form-control" onChange={handleChange} required />
                    </div>
                    
                    {/* Fragancia (antes 'Color', ahora mapeado correctamente a Java) */}
                    <div className="mb-3">
                        <label className="form-label">Fragancia/Olor</label>
                        <input name="fragancia" className="form-control" onChange={handleChange} required />
                    </div>
                    
                    {/* Precio */}
                    <div className="mb-3">
                        <label className="form-label">Precio (Bs.)</label>
                        {/* Usamos el estado inicial de jabon.precio para asegurar el tipo number */}
                        <input name="precio" type="number" className="form-control" onChange={handleChange} required />
                    </div>
                    
                    {/* Marca */}
                    <div className="mb-3">
                        <label className="form-label">Marca</label>
                        <input name="marca" className="form-control" onChange={handleChange} required />
                    </div>
                    
                    {/* Stock (Aseguramos el mapeo y el tipo number) */}
                    <div className="mb-3">
                        <label className="form-label">Stock</label>
                        <input name="stock" type="number" className="form-control" onChange={handleChange} required />
                    </div>
                    
                    {/* Tipo */}
                    <div className="mb-3">
                        <label className="form-label">Tipo</label>
                        <input name="tipo" className="form-control" onChange={handleChange} required />
                    </div>

                    <button className="btn btn-dark w-100 mt-3">Guardar</button>
                </form>
            </div>
        </div>
    );
}