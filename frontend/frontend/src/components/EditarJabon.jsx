import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JabonService from "../services/JabonService";

export default function EditarJabon() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [jabon, setJabon] = useState({
        nombre: "",
        color: "",
        precio: "",
        marca: ""
    });

    useEffect(() => {
        JabonService.getJabonById(id)
            .then((resp) => {
                setJabon(resp.data);
            })
            .catch((err) => console.error(err));
    }, [id]);

    const handleChange = (e) => {
        setJabon({
            ...jabon,
            [e.target.name]: e.target.value
        });
    };

    const actualizar = (e) => {
        e.preventDefault();

        JabonService.updateJabon(id, jabon)
            .then(() => {
                alert("Jabón actualizado correctamente");
                navigate("/jabones");
            })
            .catch((err) => console.error(err));
    };

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="card shadow p-4" style={{ width: "30rem" }}>
                <h3 className="text-center mb-4">Editar Jabón</h3>

                <form onSubmit={actualizar}>

                    <div className="mb-3">
                        <label className="form-label">Nombre</label>
                        <input
                            name="nombre"
                            className="form-control"
                            value={jabon.nombre}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Color</label>
                        <input
                            name="color"
                            className="form-control"
                            value={jabon.color}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Precio</label>
                        <input
                            name="precio"
                            type="number"
                            className="form-control"
                            value={jabon.precio}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Marca</label>
                        <input
                            name="marca"
                            className="form-control"
                            value={jabon.marca}
                            onChange={handleChange}
                        />
                    </div>

                    <button className="btn btn-dark w-100">Actualizar</button>

                </form>
            </div>
        </div>
    );
}
