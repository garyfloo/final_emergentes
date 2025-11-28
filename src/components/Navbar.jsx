import React from "react";
// Importamos NavLink para resaltar el enlace activo
import { Link, NavLink } from "react-router-dom"; 

export default function Navbar() {
    return (
        // Añadimos 'shadow-lg' para dar profundidad y 'container-fluid' para ocupar todo el ancho
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg"> 
            <div className="container-fluid"> 

                {/* Logo con ícono y color destacado */}
                <Link className="navbar-brand fw-bolder text-warning fs-4" to="/"> 
                    <i className="fas fa-soap me-2"></i> 
                    SIS414
                </Link>

                {/* Botón responsive (Toggler) */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Items derecha */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        
                        {/* Inicio - Usando NavLink para resaltar la ruta activa */}
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/">
                                <i className="fas fa-home me-1"></i> Inicio
                            </NavLink>
                        </li>

                        {/* Dropdown Jabones */}
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle"
                                href="#"
                                id="jabonesDropdown"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="fas fa-list me-1"></i> Jabones
                            </a>

                            <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="jabonesDropdown">
                                <li>
                                    <Link className="dropdown-item" to="/jabones">Lista de Jabones</Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item" to="/jabones/new">Agregar Jabón</Link>
                                </li>
                            </ul>
                        </li>

                        {/* Dropdown Tiendas */}
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle"
                                href="#"
                                id="tiendasDropdown"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="fas fa-store me-1"></i> Tiendas
                            </a>

                            <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="tiendasDropdown">
                                <li>
                                    <Link className="dropdown-item" to="/tiendas">Lista de Tiendas</Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item" to="/tiendas/new">Agregar Tienda</Link>
                                </li>
                            </ul>
                        </li>

                    </ul>
                </div>
            </div>
        </nav>
    );
}
