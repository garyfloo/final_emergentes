/*
import React from "react";
import JabonesList from "./components/JabonesList";

function App() {
    return (
        <div>
            <JabonesList />
        </div>
    );
}

export default App;
*/

// App.jsx (O App.js)

import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importación del archivo CSS con la animación de fondo
import './App.css'; 

// Componente para la página de inicio simple
import Home from "./components/Home"; 

// Componentes de Navegación (Ajustada la ruta según la estructura que definiste)
import Navbar from "./components/Navbar"; 

// JABONES
import JabonesList from "./components/JabonesList";
import RegistrarJabon from "./components/RegistrarJabon";
import EditarJabon from "./components/EditarJabon";

// TIENDAS
import TiendasList from "./components/tiendas/TiendasList";
import RegistrarTienda from "./components/tiendas/RegistrarTienda";
import EditarTienda from "./components/tiendas/EditarTienda";

function App() {
  return (
    // 1. Contenedor principal para la animación de fondo
    <div className="animated-background"> 
      <BrowserRouter>
        <Navbar />

        {/* 2. Contenedor para el contenido principal, asegurando padding y posición correcta */}
        <div className="main-content">
          <Routes>
            
            {/* Página inicial - Usamos un componente Home simple para el landing */}
            <Route path="/" element={<Home />} /> 

            {/* --- CRUD JABONES --- */}
            <Route path="/jabones" element={<JabonesList />} />
            <Route path="/jabones/new" element={<RegistrarJabon />} />
            <Route path="/jabones/edit/:id" element={<EditarJabon />} />

            {/* --- CRUD TIENDAS --- */}
            <Route path="/tiendas" element={<TiendasList />} />
            <Route path="/tiendas/new" element={<RegistrarTienda />} />
            <Route path="/tiendas/edit/:id" element={<EditarTienda />} />

          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
