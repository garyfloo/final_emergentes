/*
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // ← ESTA LÍNEA ES LA QUE FALTABA 💛

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
*/

// src/main.jsx (o src/index.js)


// En src/index.js o src/main.jsx

// src/main.jsx (o src/index.js)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importación simplificada para evitar el error de extensión
import './index.css';

// 1. CSS de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'; 

// 2. JS de Bootstrap (¡Solución para el menú desplegable!)
import 'bootstrap/dist/js/bootstrap.bundle.min'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);