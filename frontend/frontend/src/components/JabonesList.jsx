/*
import React, { useEffect, useState } from "react";
import JabonService from "../services/JabonService";

const JabonesList = () => {
    const [jabones, setJabones] = useState([]);

    useEffect(() => {
        JabonService.getJabones()
            .then((response) => {
                setJabones(response.data);
            })
            .catch((error) => {
                console.error("Error al obtener jabones:", error);
            });
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h1>Lista de Jabones</h1>
            <ul>
                {jabones.map((jabon) => (
                    <li key={jabon.id}>
                        {jabon.nombre} - {jabon.precio} Bs
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default JabonesList;

*/

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import JabonService from "../services/JabonService";

export default function JabonesList() {

  const [jabones, setJabones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarJabones();
  }, []);

  const cargarJabones = () => {
    JabonService.getJabones().then((r) => setJabones(r.data));
  };

  const eliminar = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este jabón?")) {
      JabonService.deleteJabon(id).then(() => cargarJabones());
    }
  };

  return (
    <div className="container mt-4">

      {/* TÍTULO */}
      <h2 className="fw-bold mb-4">Lista de Jabones</h2>

      {/* TABLA CORREGIDA */}
      <table className="table table-hover table-striped shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Fragancia</th>
            <th>Marca</th>
            <th>Tipo</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Tienda</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {jabones.map((j) => (
            <tr key={j.id}>
              <td>{j.id}</td>
              <td>{j.nombre}</td>
              <td>{j.fragancia}</td>
              <td>{j.marca}</td>
              <td>{j.tipo}</td>
              <td>{j.precio} Bs</td>
              <td>{j.stock}</td>
              <td>{j.tienda?.nombre}</td>

              <td>
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => navigate(`/jabones/edit/${j.id}`)}
                >
                  Editar
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => eliminar(j.id)}
                >
                  Eliminar
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}


