import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container mt-5 text-center text-white"> 
      
      {/* Tarjeta de bienvenida centrada en la pantalla */}
      <div className="card bg-dark bg-opacity-75 p-5 shadow-lg mx-auto" style={{ maxWidth: '600px', borderRadius: '15px' }}>
          <i className="fas fa-soap fa-4x text-warning mb-4"></i>
          <h1 className="display-4 mb-3 fw-bold">Bienvenido a SIS414</h1>
          <p className="lead text-light">
            Tu plataforma centralizada para la gestión de inventario de Jabones y Tiendas.
          </p>
          <hr className="my-4 border-light opacity-50" />
          <p className="mb-4">
            Usa el menú superior para acceder a todas las funcionalidades CRUD.
          </p>
          
          <div className="d-flex justify-content-center gap-3">
              <Link to="/jabones" className="btn btn-warning btn-lg">
                  <i className="fas fa-list me-2"></i> Ver Jabones
              </Link>
              <Link to="/tiendas" className="btn btn-primary btn-lg">
                  <i className="fas fa-store me-2"></i> Ver Tiendas
              </Link>
          </div>
      </div>
    </div>
  );
}