import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useParams,
    useNavigate
} from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    addDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    collection, 
    query, 
    getDoc,
    setLogLevel
} from 'firebase/firestore';

// ====================================================================
// ========================= FIREBASE SETUP ===========================
// ====================================================================

// Firebase Global Variables provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase instances
let app = null;
let db = null;
let auth = null;
let userId = null;

// Public collaborative collection paths
const TIENDAS_COLLECTION_PATH = `artifacts/${appId}/public/data/tiendas`;
const JABONES_COLLECTION_PATH = `artifacts/${appId}/public/data/jabones`;

/**
 * Initializes Firebase and authenticates the user.
 * @returns {Promise<void>}
 */
const initAuth = async () => {
    if (!firebaseConfig) {
        console.error("Firebase Config is missing.");
        return;
    }
    try {
        if (!app) {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            setLogLevel('debug'); // Enable Firestore logging
        }

        // Authentication logic
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            // Sign in anonymously if no custom token is provided
            await signInAnonymously(auth);
        }

    } catch (error) {
        console.error("Firebase initialization or authentication failed:", error);
    }
};

/**
 * Executes a callback function when the authentication state changes.
 * @param {function(string | null): void} callback - Function to run with the current userId
 * @returns {function(): void} Unsubscribe function
 */
const onAuthReady = (callback) => {
    if (!auth) {
        // Fallback for immediate calls before auth is defined
        setTimeout(() => onAuthReady(callback), 100);
        return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
        userId = user ? user.uid : null;
        callback(userId);
    });
};

// --- Firestore CRUD Helpers ---

/**
 * Subscribes to a collection in real-time.
 * @param {string} collectionPath - Firestore collection path.
 * @param {function(Array<Object>): void} callback - Callback function to receive data.
 * @returns {Promise<function(): void>} Unsubscribe function for the snapshot listener.
 */
const subscribeToCollection = async (collectionPath, callback) => {
    if (!db) throw new Error("Firestore not initialized.");
    const q = query(collection(db, collectionPath));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to collection:", error);
    });

    return unsubscribe;
};

/**
 * Fetches a single document by ID.
 * @param {string} collectionPath - Firestore collection path.
 * @param {string} id - Document ID.
 * @returns {Promise<Object | null>} Document data or null if not found.
 */
const getDocumentById = async (collectionPath, id) => {
    if (!db) throw new Error("Firestore not initialized.");
    const docRef = doc(db, collectionPath, id);
    try {
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error fetching document:", error);
        return null;
    }
};

/**
 * Creates a new document.
 * @param {string} collectionPath - Firestore collection path.
 * @param {Object} data - Data to save.
 * @returns {Promise<string>} New document ID.
 */
const createDocument = async (collectionPath, data) => {
    if (!db) throw new Error("Firestore not initialized.");
    try {
        const docRef = await addDoc(collection(db, collectionPath), {
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: userId,
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating document:", error);
        throw error;
    }
};

/**
 * Updates an existing document.
 * @param {string} collectionPath - Firestore collection path.
 * @param {string} id - Document ID.
 * @param {Object} data - Data to update.
 * @returns {Promise<void>}
 */
const updateDocument = async (collectionPath, id, data) => {
    if (!db) throw new Error("Firestore not initialized.");
    const docRef = doc(db, collectionPath, id);
    try {
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
        });
    } catch (error) {
        console.error("Error updating document:", error);
        throw error;
    }
};

/**
 * Deletes a document.
 * @param {string} collectionPath - Firestore collection path.
 * @param {string} id - Document ID.
 * @returns {Promise<void>}
 */
const deleteDocument = async (collectionPath, id) => {
    if (!db) throw new Error("Firestore not initialized.");
    const docRef = doc(db, collectionPath, id);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
    }
};

// ====================================================================
// =========================== UI COMPONENTS ============================
// ====================================================================

// --- Context for Auth State and Modal ---
const AppContext = createContext();

const useApp = () => useContext(AppContext);

function AppProvider({ children }) {
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [modal, setModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        onConfirm: null, 
        isAlert: true // If true, it's an alert (no cancel button)
    });

    useEffect(() => {
        initAuth();
        const unsubscribe = onAuthReady(() => {
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const showModal = useCallback((title, message, onConfirm, isAlert = true) => {
        setModal({ isOpen: true, title, message, onConfirm, isAlert });
    }, []);

    const closeModal = useCallback(() => {
        setModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <AppContext.Provider value={{ isAuthReady, userId, showModal, closeModal }}>
            {children}
            <ConfirmModal modal={modal} closeModal={closeModal} />
        </AppContext.Provider>
    );
}

// Custom Modal Component to replace window.alert/confirm
function ConfirmModal({ modal, closeModal }) {
    const handleConfirm = () => {
        if (modal.onConfirm) {
            modal.onConfirm();
        }
        closeModal();
    };

    if (!modal.isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" style={{maxWidth: '450px'}}>
                <h3 className={`text-xl font-bold mb-4 ${modal.isAlert ? 'text-danger' : 'text-primary'}`}>{modal.title}</h3>
                <p className="text-gray-700 mb-6">{modal.message}</p>
                <div className="flex justify-end space-x-3">
                    {!modal.isAlert && (
                        <button 
                            className="btn btn-secondary"
                            onClick={closeModal}
                        >
                            Cancelar
                        </button>
                    )}
                    <button 
                        className={`btn btn-${modal.isAlert ? 'primary' : 'danger'}`}
                        onClick={handleConfirm}
                    >
                        {modal.isAlert ? 'Aceptar' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}


function LoadingScreen() {
    return (
        <div className="text-center py-5">
            <div className="spinner-border text-light" role="status"></div>
            <p className="mt-2 text-white">Conectando con la base de datos compartida...</p>
        </div>
    );
}


function Navbar() {
    const { userId } = useApp();
    const shortUserId = userId ? `${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}` : 'Desconocido';

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-md">
            <div className="container-fluid">
                <Link className="navbar-brand text-warning font-bold text-lg" to="/">
                    <i className="fas fa-hand-holding-heart me-2"></i> SoapCo Admin
                </Link>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link text-white hover:text-warning" to="/tiendas">
                                <i className="fas fa-store me-1"></i> Tiendas
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link text-white hover:text-warning" to="/jabones">
                                <i className="fas fa-soap me-1"></i> Jabones
                            </Link>
                        </li>
                    </ul>
                    <span className="navbar-text text-sm text-muted">
                        <i className="fas fa-user-circle me-1"></i> ID de Usuario: {userId || 'Cargando...'}
                    </span>
                </div>
            </div>
        </nav>
    );
}

function Home() {
    return (
        <div className="container mt-5">
            <div className="text-center text-white p-5 bg-dark rounded-lg shadow-2xl bg-opacity-75">
                <i className="fas fa-soap text-warning animate-bounce-slow" style={{ fontSize: '4rem' }}></i>
                <h1 className="mt-4 text-4xl font-extrabold">Bienvenido al Panel de Gestión Colaborativo</h1>
                <p className="lead mt-3 text-lg opacity-75">
                    Utiliza esta plataforma en tiempo real para administrar tu inventario de tiendas y jabones. 
                    Todos los cambios se reflejan instantáneamente para todos los usuarios.
                </p>
                <div className="mt-5 flex justify-center space-x-4">
                    <Link to="/tiendas" className="btn btn-primary btn-lg shadow-lg">
                        <i className="fas fa-store me-2"></i> Ver Tiendas
                    </Link>
                    <Link to="/jabones" className="btn btn-warning btn-lg shadow-lg">
                        <i className="fas fa-soap me-2"></i> Ver Jabones
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ====================================================================
// =========================== CRUD TIENDAS ===========================
// ====================================================================

// Listado de Tiendas (Tiempo Real)
function TiendasList() {
    const { isAuthReady, showModal } = useApp();
    const [tiendas, setTiendas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) return;
        setIsLoading(true);
        let unsubscribe = null;
        
        subscribeToCollection(TIENDAS_COLLECTION_PATH, (data) => {
            setTiendas(data);
            setIsLoading(false);
        }).then(func => {
            unsubscribe = func;
        }).catch(e => {
            console.error(e);
            showModal("Error de Conexión", "No se pudo conectar a la colección de Tiendas. Revisa la consola.", null);
            setIsLoading(false);
        });

        return () => unsubscribe && unsubscribe();
    }, [isAuthReady, showModal]); 

    const eliminarTienda = async (id) => {
        const onConfirm = async () => {
            try {
                await deleteDocument(TIENDAS_COLLECTION_PATH, id);
                showModal("Éxito", "Tienda eliminada con éxito.", null);
            } catch (error) {
                console.error("Error al eliminar tienda:", error);
                showModal("Error", "Hubo un error al eliminar la tienda.", null);
            }
        };

        showModal(
            "Confirmar Eliminación", 
            "¿Está seguro de que desea eliminar esta tienda? Esta acción no se puede deshacer.", 
            onConfirm, 
            false
        );
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white mb-0">Gestión de Tiendas <i className="fas fa-store text-primary"></i></h2>
                <Link to="/tiendas/new" className="btn btn-success btn-lg shadow-sm">
                    <i className="fas fa-plus me-1"></i> Agregar Tienda
                </Link>
            </div>
            
            <div className="card shadow-lg border-0 bg-dark text-white bg-opacity-75 rounded-xl">
                <div className="card-header bg-primary text-white border-primary rounded-t-xl">
                    <h5 className="mb-0 text-white">Inventario de Tiendas Registradas (Colaborativo)</h5>
                </div>
                
                <div className="card-body p-0">
                    
                    {isLoading || !isAuthReady ? (
                        <LoadingScreen />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-dark table-striped table-hover mb-0"> 
                                <thead className="table-secondary">
                                    <tr>
                                        <th className="text-dark">Nombre</th>
                                        <th className="text-dark">Dirección</th>
                                        <th className="text-dark" style={{ width: '200px' }}>Acciones</th>
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
                                                        className="btn btn-warning btn-sm me-2 transition duration-150 ease-in-out hover:scale-105"
                                                    >
                                                        <i className="fas fa-pen"></i> Editar
                                                    </Link>
                                                    <button
                                                        className="btn btn-danger btn-sm transition duration-150 ease-in-out hover:scale-105"
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
                        </div>
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
    const { isAuthReady, showModal } = useApp();
    const [tienda, setTienda] = useState({ nombre: '', direccion: '' });
    const [loadingData, setLoadingData] = useState(id ? true : false);
    const isEdit = !!id;

    // Cargar datos si es edición
    useEffect(() => {
        if (!isAuthReady) return;
        if (isEdit) {
            getDocumentById(TIENDAS_COLLECTION_PATH, id).then(data => {
                if (data) {
                    setTienda({ nombre: data.nombre, direccion: data.direccion });
                } else {
                    showModal("Error", "Tienda no encontrada.", () => navigate('/tiendas'));
                }
                setLoadingData(false);
            }).catch(e => {
                console.error(e);
                showModal("Error de Carga", "Error al cargar los datos de la tienda.", () => navigate('/tiendas'));
            });
        }
    }, [id, isEdit, navigate, isAuthReady, showModal]);

    const handleChange = (e) => {
        setTienda({ ...tienda, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tienda.nombre || !tienda.direccion) {
            showModal("Advertencia", "Ambos campos (Nombre y Dirección) son obligatorios.", null);
            return;
        }

        try {
            if (isEdit) {
                await updateDocument(TIENDAS_COLLECTION_PATH, id, tienda);
                showModal("Éxito", "Tienda actualizada con éxito.", () => navigate('/tiendas'));
            } else {
                await createDocument(TIENDAS_COLLECTION_PATH, tienda);
                showModal("Éxito", "Tienda registrada con éxito.", () => navigate('/tiendas'));
            }
        } catch (error) {
            console.error("Error en la operación de Tienda:", error);
            showModal("Error", "Error al guardar la tienda. Consulte la consola para más detalles.", null);
        }
    };

    if (!isAuthReady || loadingData) return <div className="text-center text-white mt-5"><LoadingScreen /></div>;

    return (
        <div className="container mt-5" style={{ maxWidth: '600px' }}>
            <h2 className="text-white mb-4">{isEdit ? 'Editar Tienda' : 'Registrar Nueva Tienda'}</h2>
            <div className="card shadow-lg p-4 bg-dark text-white bg-opacity-75 rounded-xl">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nombre" className="form-label font-bold text-primary">Nombre de la Tienda</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark rounded-md"
                            id="nombre"
                            name="nombre"
                            value={tienda.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="direccion" className="form-label font-bold text-primary">Dirección</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark rounded-md"
                            id="direccion"
                            name="direccion"
                            value={tienda.direccion}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="d-flex justify-content-between mt-5">
                        <button type="submit" className={`btn btn-${isEdit ? 'warning' : 'success'} btn-lg shadow-md transition duration-150 ease-in-out hover:scale-105`}>
                            <i className={`fas fa-${isEdit ? 'save' : 'plus'}`}></i> {isEdit ? 'Actualizar' : 'Registrar'}
                        </button>
                        <Link to="/tiendas" className="btn btn-secondary btn-lg shadow-md transition duration-150 ease-in-out hover:scale-105">
                            <i className="fas fa-arrow-left"></i> Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ====================================================================
// =========================== CRUD JABONES ===========================
// ====================================================================

// Listado de Jabones (Tiempo Real)
function JabonesList() {
    const { isAuthReady, showModal } = useApp();
    const [jabones, setJabones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) return;
        setIsLoading(true);
        let unsubscribe = null;

        subscribeToCollection(JABONES_COLLECTION_PATH, (data) => {
            setJabones(data);
            setIsLoading(false);
        }).then(func => {
            unsubscribe = func;
        }).catch(e => {
            console.error(e);
            showModal("Error de Conexión", "No se pudo conectar a la colección de Jabones. Revisa la consola.", null);
            setIsLoading(false);
        });

        return () => unsubscribe && unsubscribe();
    }, [isAuthReady, showModal]); 

    const eliminarJabon = (id) => {
        const onConfirm = async () => {
            try {
                await deleteDocument(JABONES_COLLECTION_PATH, id);
                showModal("Éxito", "Jabón eliminado con éxito.", null);
            } catch (error) {
                console.error("Error al eliminar jabón:", error);
                showModal("Error", "Hubo un error al eliminar el jabón.", null);
            }
        };

        showModal(
            "Confirmar Eliminación", 
            "¿Está seguro de que desea eliminar este jabón? Esta acción no se puede deshacer.", 
            onConfirm, 
            false
        );
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white mb-0">Gestión de Jabones <i className="fas fa-soap text-warning"></i></h2>
                <Link to="/jabones/new" className="btn btn-warning btn-lg shadow-sm">
                    <i className="fas fa-plus me-1"></i> Agregar Jabón
                </Link>
            </div>
            
            <div className="card shadow-lg border-0 bg-dark text-white bg-opacity-75 rounded-xl">
                <div className="card-header bg-warning text-dark border-warning rounded-t-xl">
                    <h5 className="mb-0 text-dark">Inventario de Jabones Registrados (Colaborativo)</h5>
                </div>
                
                <div className="card-body p-0">
                    
                    {isLoading || !isAuthReady ? (
                        <LoadingScreen />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-dark table-striped table-hover mb-0"> 
                                <thead className="table-secondary">
                                    <tr>
                                        <th className="text-dark">Nombre</th>
                                        <th className="text-dark">Aroma</th>
                                        <th className="text-dark">Precio</th>
                                        <th className="text-dark" style={{ width: '200px' }}>Acciones</th>
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
                                                        className="btn btn-warning btn-sm me-2 transition duration-150 ease-in-out hover:scale-105"
                                                    >
                                                        <i className="fas fa-pen"></i> Editar
                                                    </Link>
                                                    <button
                                                        className="btn btn-danger btn-sm transition duration-150 ease-in-out hover:scale-105"
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
                        </div>
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
    const { isAuthReady, showModal } = useApp();
    const [jabon, setJabon] = useState({ nombre: '', aroma: '', precio: 0 });
    const [loadingData, setLoadingData] = useState(id ? true : false);
    const isEdit = !!id;

    // Cargar datos si es edición
    useEffect(() => {
        if (!isAuthReady) return;
        if (isEdit) {
            getDocumentById(JABONES_COLLECTION_PATH, id).then(data => {
                if (data) {
                    setJabon({ 
                        nombre: data.nombre || '', 
                        aroma: data.aroma || '', 
                        precio: parseFloat(data.precio || 0) 
                    });
                } else {
                    showModal("Error", "Jabón no encontrado.", () => navigate('/jabones'));
                }
                setLoadingData(false);
            }).catch(e => {
                console.error(e);
                showModal("Error de Carga", "Error al cargar los datos del jabón.", () => navigate('/jabones'));
            });
        }
    }, [id, isEdit, navigate, isAuthReady, showModal]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setJabon({ 
            ...jabon, 
            [name]: type === 'number' ? parseFloat(value) : value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!jabon.nombre || !jabon.aroma || jabon.precio <= 0) {
            showModal("Advertencia", "El nombre, aroma y un precio mayor a 0 son obligatorios.", null);
            return;
        }

        try {
            // Ensure price is a number before saving (Firestore)
            const dataToSave = { 
                ...jabon, 
                precio: parseFloat(jabon.precio) 
            }; 
            
            if (isEdit) {
                await updateDocument(JABONES_COLLECTION_PATH, id, dataToSave);
                showModal("Éxito", "Jabón actualizado con éxito.", () => navigate('/jabones'));
            } else {
                await createDocument(JABONES_COLLECTION_PATH, dataToSave);
                showModal("Éxito", "Jabón registrado con éxito.", () => navigate('/jabones'));
            }
        } catch (error) {
            console.error("Error en la operación de Jabón:", error);
            showModal("Error", "Error al guardar el jabón. Consulte la consola para más detalles.", null);
        }
    };

    if (!isAuthReady || loadingData) return <div className="text-center text-white mt-5"><LoadingScreen /></div>;

    return (
        <div className="container mt-5" style={{ maxWidth: '600px' }}>
            <h2 className="text-white mb-4">{isEdit ? 'Editar Jabón' : 'Registrar Nuevo Jabón'}</h2>
            <div className="card shadow-lg p-4 bg-dark text-white bg-opacity-75 rounded-xl">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nombre" className="form-label font-bold text-warning">Nombre del Jabón</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark rounded-md"
                            id="nombre"
                            name="nombre"
                            value={jabon.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="aroma" className="form-label font-bold text-warning">Aroma</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark rounded-md"
                            id="aroma"
                            name="aroma"
                            value={jabon.aroma}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="precio" className="form-label font-bold text-warning">Precio ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control bg-secondary text-white border-dark rounded-md"
                            id="precio"
                            name="precio"
                            value={jabon.precio}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="d-flex justify-content-between mt-5">
                        <button type="submit" className={`btn btn-${isEdit ? 'warning' : 'success'} btn-lg shadow-md transition duration-150 ease-in-out hover:scale-105`}>
                            <i className={`fas fa-${isEdit ? 'save' : 'plus'}`}></i> {isEdit ? 'Actualizar' : 'Registrar'}
                        </button>
                        <Link to="/jabones" className="btn btn-secondary btn-lg shadow-md transition duration-150 ease-in-out hover:scale-105">
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

function MainApp() {
    return (
        // Estilos para el fondo animado (estos estilos se incluyen en el JSX)
        <div className="animated-background"> 
            <AppProvider>
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
            </AppProvider>
            
            {/* Estilos CSS incluidos en el mismo archivo para el despliegue monolítico */}
            <style jsx="true">{`
                /* Estilos globales */
                @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
                html, body, #root, .animated-background {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    font-family: 'Inter', sans-serif;
                }
                
                /* Fondo Animado de Degradado: Estilo moderno y llamativo */
                .animated-background {
                    min-height: 100vh;
                    width: 100%;
                    background: linear-gradient(
                        -45deg,
                        #007bff, 
                        #28a745, 
                        #ffc107, 
                        #dc3545 
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
                    background-color: #444 !important; /* Darker secondary on focus */
                    border-color: #ffc107 !important;
                    box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.4) !important; /* Brighter shadow */
                }

                /* Estilos para cards y tablas */
                .card {
                    border-radius: 1rem !important;
                    backdrop-filter: blur(5px);
                    background-color: rgba(33, 37, 41, 0.85) !important;
                }
                .card-header {
                    border-radius: 1rem 1rem 0 0 !important;
                }
                .table-dark tbody tr:hover {
                    background-color: rgba(60, 60, 60, 0.9); /* Subtle hover effect */
                }
            `}</style>
        </div>
    );
}

// Exportación única de la aplicación
export default MainApp;