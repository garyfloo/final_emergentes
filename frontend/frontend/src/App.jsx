import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    setLogLevel, 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    getDoc,
    query
} from 'firebase/firestore';


// ====================================================================
// ========================== CONFIGURACIÓN GLOBAL ======================
// ====================================================================

/* global __app_id, __firebase_config, __initial_auth_token */

// Habilitar logs detallados de Firebase 
setLogLevel('debug');

// --- 1. MANEJO DE VARIABLES GLOBALES DEL ENTORNO ---
const getGlobalVariable = (name, defaultValue) => {
    // Las variables globales son inyectadas por el entorno de despliegue (Canvas)
    if (typeof window !== 'undefined' && typeof window[name] !== 'undefined') {
        return window[name];
    }
    return defaultValue;
};

const rawAppId = getGlobalVariable('__app_id', 'default-app-id');
const rawFirebaseConfig = getGlobalVariable('__firebase_config', '{}');
const initialAuthToken = getGlobalVariable('__initial_auth_token', null);

const APP_ID = rawAppId;
let firebaseConfig;
try {
    firebaseConfig = JSON.parse(rawFirebaseConfig);
} catch (e) {
    console.error("Error al parsear __firebase_config:", e);
    firebaseConfig = {};
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Variables de estado global
let isAuthReady = false;
let currentUserId = null;

// Rutas de las colecciones (Públicas para colaboración)
const TIENDAS_COLLECTION_PATH = `artifacts/${APP_ID}/public/data/tiendas`;
const JABONES_COLLECTION_PATH = `artifacts/${APP_ID}/public/data/jabones`;

/**
 * Función para inicializar la autenticación con el token del entorno.
 * Es crucial para que Firestore permita la lectura/escritura.
 */
const initAuth = async () => {
    if (isAuthReady) return; 

    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); 

            if (!user) {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Error al autenticar con Firebase:", error);
                }
            }
            
            currentUserId = auth.currentUser?.uid || 'anonymous';
            isAuthReady = true;
            console.log("Firebase Auth listo. User ID:", currentUserId);
            resolve();
        });
    });
};

// ====================================================================
// ========================= SERVICIOS (CRUD) =========================
// ====================================================================

/**
 * Obtiene datos en tiempo real de una colección.
 */
const subscribeToCollection = async (path, callback) => {
    await initAuth(); 
    const colRef = collection(db, path);
    const q = query(colRef); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(data);
    }, (error) => {
        console.error(`Error al escuchar ${path}:`, error);
    });

    return unsubscribe;
};

/**
 * Obtiene un documento por ID.
 */
const getDocumentById = async (path, id) => {
    await initAuth(); 
    const docRef = doc(db, path, id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error(`Error al obtener documento ${id} en ${path}:`, error);
        return null;
    }
};

/**
 * Crea un nuevo documento.
 */
const createDocument = async (path, data) => {
    await initAuth(); 
    return addDoc(collection(db, path), data);
};

/**
 * Actualiza un documento existente.
 */
const updateDocument = async (path, id, data) => {
    await initAuth(); 
    return updateDoc(doc(db, path, id), data);
};

/**
 * Elimina un documento.
 */
const deleteDocument = async (path, id) => {
    await initAuth(); 
    return deleteDoc(doc(db, path, id));
};


// ====================================================================
// =========================== COMPONENTES ============================
// ====================================================================

// --- 1. COMPONENTE HOME ---
function Home() {
    return (
        <div className="container mt-5"> 
            <div className="card bg-dark bg-opacity-75 p-5 shadow-lg mx-auto border-warning" style={{ maxWidth: '600px', borderRadius: '15px' }}>
                <i className="fas fa-soap fa-4x text-warning mb-4 animate-bounce-slow"></i>
                <h1 className="display-4 mb-3 fw-bold text-white">Examen Final SIS414</h1>
                <p className="lead text-light">
                    Plataforma centralizada para la gestión colaborativa de inventario de Jabones y Tiendas utilizando React y Firebase Firestore en tiempo real.
                </p>
                <hr className="my-4 border-light opacity-50" />
                <div className="alert alert-info border-0 rounded-lg">
                    <small className="fw-bold">TU ID DE USUARIO: {currentUserId || 'Cargando...'}</small><br/>
                    <small>Este ID asegura el acceso a la base de datos compartida.</small>
                </div>
                
                <div className="d-flex justify-content-center gap-3 mt-4">
                    <Link to="/jabones" className="btn btn-warning btn-lg shadow">
                        <i className="fas fa-list me-2"></i> Gestión de Jabones
                    </Link>
                    <Link to="/tiendas" className="btn btn-primary btn-lg shadow">
                        <i className="fas fa-store me-2"></i> Gestión de Tiendas
                    </Link>
                </div>
            </div>
        </div>
    );
}

// --- 2. COMPONENTE NAVBAR ---
function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg"> 
            <div className="container-fluid"> 
                <Link className="navbar-brand fw-bolder text-warning fs-4" to="/"> 
                    <i className="fas fa-soap me-2"></i> 
                    SIS414
                </Link>

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

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        
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
                                <li><Link className="dropdown-item" to="/jabones">Lista de Jabones</Link></li>
                                <li><Link className="dropdown-item" to="/jabones/new">Agregar Jabón</Link></li>
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
                                <li><Link className="dropdown-item" to="/tiendas">Lista de Tiendas</Link></li>
                                <li><Link className="dropdown-item" to="/tiendas/new">Agregar Tienda</Link></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

// --- 3. CRUD TIENDAS ---

// Listado de Tiendas (Tiempo Real)
function TiendasList() {
    const [tiendas, setTiendas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Suscripción a la colección para datos en tiempo real
        let unsubscribe = null;
        subscribeToCollection(TIENDAS_COLLECTION_PATH, (data) => {
            setTiendas(data);
            setIsLoading(false);
        }).then(func => {
            unsubscribe = func;
        });

        // Limpieza: detiene la escucha al desmontar
        return () => unsubscribe && unsubscribe();
    }, []); 

    const eliminarTienda = async (id) => {
        // En un entorno real se usaría una modal personalizada. Usamos window.confirm por simplicidad.
        if (!window.confirm("¿Está seguro de que desea eliminar esta tienda?")) return;
        try {
            await deleteDocument(TIENDAS_COLLECTION_PATH, id);
        } catch (error) {
            console.error("Error al eliminar tienda:", error);
            window.alert("Hubo un error al eliminar la tienda.");
        }
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white mb-0">Gestión de Tiendas <i className="fas fa-store text-primary"></i></h2>
                <Link to="/tiendas/new" className="btn btn-success btn-lg shadow-sm">
                    + Agregar Tienda
                </Link>
            </div>
            
            <div className="card shadow-lg border-0 bg-dark text-white bg-opacity-75">
                <div className="card-header bg-dark border-secondary">
                    <h5 className="mb-0 text-white opacity-75">Inventario de Tiendas Registradas (Colaborativo)</h5>
                </div>
                
                <div className="card-body p-0">
                    
                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-primary">Cargando datos compartidos...</p>
                        </div>
                    ) : (
                        <table className="table table-dark table-striped table-hover mb-0"> 
                            <thead className="table-secondary">
                                <tr>
                                    <th className="text-dark">Nombre</th>
                                    <th className="text-dark">Dirección</th>
                                    <th className="text-dark">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tiendas.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center text-muted py-3">No hay tiendas registradas.</td>
                                    </tr>
                                ) : (
                                    tiendas.map((t) => (
                                        <tr key={t.id}>
                                            <td>{t.nombre}</td>
                                            <td>{t.direccion}</td>
                                            <td>
                                                <Link
                                                    to={`/tiendas/edit/${t.id}`}
                                                    className="btn btn-warning btn-sm me-2"
                                                >
                                                    <i className="fas fa-pen"></i> Editar
                                                </Link>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => eliminarTienda(t.id)}
                                                >
                                                    <i className="fas fa-trash"></i> Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// Registro/Edición de Tiendas
function RegistrarTienda() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tienda, setTienda] = useState({ nombre: '', direccion: '' });
    const [loadingData, setLoadingData] = useState(id ? true : false);
    const isEdit = !!id;

    // Cargar datos si es edición
    useEffect(() => {
        if (isEdit) {
            getDocumentById(TIENDAS_COLLECTION_PATH, id).then(data => {
                if (data) {
                    setTienda({ nombre: data.nombre, direccion: data.direccion });
                } else {
                    window.alert("Tienda no encontrada.");
                    navigate('/tiendas');
                }
                setLoadingData(false);
            });
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        setTienda({ ...tienda, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tienda.nombre || !tienda.direccion) {
            window.alert("Ambos campos son obligatorios.");
            return;
        }

        try {
            if (isEdit) {
                await updateDocument(TIENDAS_COLLECTION_PATH, id, tienda);
                window.alert("Tienda actualizada con éxito.");
            } else {
                await createDocument(TIENDAS_COLLECTION_PATH, tienda);
                window.alert("Tienda registrada con éxito.");
            }
            navigate('/tiendas');
        } catch (error) {
            console.error("Error en la operación de Tienda:", error);
            window.alert("Error al guardar la tienda.");
        }
    };

    if (loadingData) return <div className="text-center text-white mt-5">Cargando datos de tienda...</div>;

    return (
        <div className="container mt-5" style={{ maxWidth: '600px' }}>
            <h2 className="text-white mb-4">{isEdit ? 'Editar Tienda' : 'Registrar Nueva Tienda'}</h2>
            <div className="card shadow-lg p-4 bg-dark text-white bg-opacity-75">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nombre" className="form-label">Nombre de la Tienda</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark"
                            id="nombre"
                            name="nombre"
                            value={tienda.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="direccion" className="form-label">Dirección</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark"
                            id="direccion"
                            name="direccion"
                            value={tienda.direccion}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="d-flex justify-content-between mt-4">
                        <button type="submit" className={`btn btn-${isEdit ? 'warning' : 'success'} btn-lg`}>
                            <i className={`fas fa-${isEdit ? 'save' : 'plus'}`}></i> {isEdit ? 'Actualizar' : 'Registrar'}
                        </button>
                        <Link to="/tiendas" className="btn btn-secondary btn-lg">
                            <i className="fas fa-arrow-left"></i> Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- 4. CRUD JABONES ---

// Listado de Jabones (Tiempo Real)
function JabonesList() {
    const [jabones, setJabones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Suscripción a la colección
        let unsubscribe = null;
        subscribeToCollection(JABONES_COLLECTION_PATH, (data) => {
            setJabones(data);
            setIsLoading(false);
        }).then(func => {
            unsubscribe = func;
        });

        return () => unsubscribe && unsubscribe();
    }, []); 

    const eliminarJabon = async (id) => {
        if (!window.confirm("¿Está seguro de que desea eliminar este jabón?")) return;
        try {
            await deleteDocument(JABONES_COLLECTION_PATH, id);
        } catch (error) {
            console.error("Error al eliminar jabón:", error);
            window.alert("Hubo un error al eliminar el jabón.");
        }
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white mb-0">Gestión de Jabones <i className="fas fa-soap text-warning"></i></h2>
                <Link to="/jabones/new" className="btn btn-warning btn-lg shadow-sm">
                    + Agregar Jabón
                </Link>
            </div>
            
            <div className="card shadow-lg border-0 bg-dark text-white bg-opacity-75">
                <div className="card-header bg-dark border-secondary">
                    <h5 className="mb-0 text-white opacity-75">Inventario de Jabones Registrados (Colaborativo)</h5>
                </div>
                
                <div className="card-body p-0">
                    
                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-warning" role="status"></div>
                            <p className="mt-2 text-warning">Cargando datos compartidos...</p>
                        </div>
                    ) : (
                        <table className="table table-dark table-striped table-hover mb-0"> 
                            <thead className="table-secondary">
                                <tr>
                                    <th className="text-dark">Nombre</th>
                                    <th className="text-dark">Aroma</th>
                                    <th className="text-dark">Precio</th>
                                    <th className="text-dark">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jabones.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted py-3">No hay jabones registrados.</td>
                                    </tr>
                                ) : (
                                    jabones.map((j) => (
                                        <tr key={j.id}>
                                            <td>{j.nombre}</td>
                                            <td>{j.aroma}</td>
                                            <td>${parseFloat(j.precio).toFixed(2)}</td>
                                            <td>
                                                <Link
                                                    to={`/jabones/edit/${j.id}`}
                                                    className="btn btn-warning btn-sm me-2"
                                                >
                                                    <i className="fas fa-pen"></i> Editar
                                                </Link>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => eliminarJabon(j.id)}
                                                >
                                                    <i className="fas fa-trash"></i> Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// Registro/Edición de Jabones
function RegistrarJabon() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [jabon, setJabon] = useState({ nombre: '', aroma: '', precio: 0 });
    const [loadingData, setLoadingData] = useState(id ? true : false);
    const isEdit = !!id;

    // Cargar datos si es edición
    useEffect(() => {
        if (isEdit) {
            getDocumentById(JABONES_COLLECTION_PATH, id).then(data => {
                if (data) {
                    setJabon({ 
                        nombre: data.nombre, 
                        aroma: data.aroma, 
                        precio: parseFloat(data.precio || 0) 
                    });
                } else {
                    window.alert("Jabón no encontrado.");
                    navigate('/jabones');
                }
                setLoadingData(false);
            });
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setJabon({ 
            ...jabon, 
            [name]: type === 'number' ? parseFloat(value) : value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!jabon.nombre || !jabon.aroma || jabon.precio <= 0) {
            window.alert("Todos los campos son obligatorios y el precio debe ser mayor a 0.");
            return;
        }

        try {
            const dataToSave = { ...jabon, precio: parseFloat(jabon.precio) }; 
            
            if (isEdit) {
                await updateDocument(JABONES_COLLECTION_PATH, id, dataToSave);
                window.alert("Jabón actualizado con éxito.");
            } else {
                await createDocument(JABONES_COLLECTION_PATH, dataToSave);
                window.alert("Jabón registrado con éxito.");
            }
            navigate('/jabones');
        } catch (error) {
            console.error("Error en la operación de Jabón:", error);
            window.alert("Error al guardar el jabón.");
        }
    };

    if (loadingData) return <div className="text-center text-white mt-5">Cargando datos de jabón...</div>;

    return (
        <div className="container mt-5" style={{ maxWidth: '600px' }}>
            <h2 className="text-white mb-4">{isEdit ? 'Editar Jabón' : 'Registrar Nuevo Jabón'}</h2>
            <div className="card shadow-lg p-4 bg-dark text-white bg-opacity-75">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nombre" className="form-label">Nombre del Jabón</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark"
                            id="nombre"
                            name="nombre"
                            value={jabon.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="aroma" className="form-label">Aroma</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark"
                            id="aroma"
                            name="aroma"
                            value={jabon.aroma}
                            onChange={handleChange}
                            required
                        />
                    </div>
                     <div className="mb-3">
                        <label htmlFor="precio" className="form-label">Precio ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control bg-secondary text-white border-dark"
                            id="precio"
                            name="precio"
                            value={jabon.precio}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="d-flex justify-content-between mt-4">
                        <button type="submit" className={`btn btn-${isEdit ? 'warning' : 'success'} btn-lg`}>
                            <i className={`fas fa-${isEdit ? 'save' : 'plus'}`}></i> {isEdit ? 'Actualizar' : 'Registrar'}
                        </button>
                        <Link to="/jabones" className="btn btn-secondary btn-lg">
                            <i className="fas fa-arrow-left"></i> Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}


// ====================================================================
// ============================= APP PRINCIPAL ============================
// ====================================================================

function App() {

    // Ejecuta la función de autenticación al montar el componente.
    useEffect(() => {
        initAuth(); 
    }, []);

    return (
        // Estilos para el fondo animado (estos estilos se incluyen en el JSX)
        <div className="animated-background"> 
            <Router>
                <Navbar />

                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        
                        {/* CRUD TIENDAS */}
                        <Route path="/tiendas" element={<TiendasList />} />
                        <Route path="/tiendas/new" element={<RegistrarTienda />} />
                        <Route path="/tiendas/edit/:id" element={<RegistrarTienda />} />

                        {/* CRUD JABONES */}
                        <Route path="/jabones" element={<JabonesList />} />
                        <Route path="/jabones/new" element={<RegistrarJabon />} />
                        <Route path="/jabones/edit/:id" element={<RegistrarJabon />} />
                    </Routes>
                </div>
            </Router>
            {/* Estilos CSS incluidos en el mismo archivo para el despliegue monolítico */}
            <style jsx="true">{`
                /* Estilos globales */
                html, body, #root, .animated-background {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }

                /* Fondo Animado de Degradado: Estilo moderno y llamativo */
                .animated-background {
                    min-height: 100vh;
                    width: 100%;
                    background: linear-gradient(
                        -45deg,
                        #007bff,  /* Azul primario */
                        #28a745,  /* Verde éxito */
                        #ffc107,  /* Amarillo alerta */
                        #dc3545   /* Rojo peligro */
                    );
                    background-size: 400% 400%; 
                    animation: gradientAnimation 15s ease infinite; 
                }

                /* Animación del movimiento del degradado */
                @keyframes gradientAnimation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                /* Contenido Principal */
                .main-content {
                    position: relative; 
                    z-index: 1; 
                    padding-top: 20px; 
                    padding-bottom: 50px;
                }
                
                /* Icono de jabón flotante en Home */
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                
                /* Estilo de enfoque para los inputs */
                .form-control.bg-secondary:focus {
                    background-color: #555 !important;
                    border-color: #ffc107 !important;
                    box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25) !important;
                }
            `}</style>
        </div>
    );
}

// Exportación única de la aplicación
export default App;