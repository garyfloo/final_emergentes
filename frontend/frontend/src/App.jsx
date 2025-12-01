import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    addDoc, 
    setDoc, 
    onSnapshot, 
    collection, 
    query, 
    getDoc, 
    deleteDoc,
    setLogLevel
} from 'firebase/firestore';

// ====================================================================
// ========================= CONFIGURACIÓN GLOBAL =======================
// ====================================================================

// COLLECTION PATHS (Private, using userId)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const getUserCollectionPath = (userId, collectionName) => 
    `/artifacts/${appId}/users/${userId}/${collectionName}`;

// Collection names
const TIENDAS_COLLECTION_NAME = 'tiendas';
const JABONES_COLLECTION_NAME = 'jabones';

// Firebase Initialization (Using global variables)
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// setLogLevel('debug'); // Uncomment to see Firestore logs

// ====================================================================
// ======================== CONTEXT AND PROVIDER ========================
// ====================================================================

const AppContext = createContext();

const useApp = () => useContext(AppContext);

/**
 * Initializes authentication and sets the auth state listener.
 * @param {function} setUserId - Setter for the user ID.
 * @param {function} setIsAuthReady - Setter for the authentication ready state.
 * @returns {function} Function to unsubscribe from the listener.
 */
function initializeAuthAndFirestore(setUserId, setIsAuthReady) {
    // 1. Handle authentication
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // If the initial token exists, use it. Otherwise, sign in anonymously.
            const customToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
            if (customToken) {
                try {
                    await signInWithCustomToken(auth, customToken);
                } catch (error) {
                    console.error("Error signing in with custom token, falling back to anonymous:", error);
                    await signInAnonymously(auth);
                }
            } else {
                await signInAnonymously(auth);
            }
        }
        
        // 2. Get the user ID (can be the real one or the anonymous one)
        const currentUserId = auth.currentUser?.uid || crypto.randomUUID();
        setUserId(currentUserId);
        
        // 3. Mark authentication as ready
        setIsAuthReady(true);
    });

    return unsubscribe;
}

// Utility functions for Firestore

/**
 * Creates a new document in the specified collection.
 * @param {string} collectionPath - Full path of the collection.
 * @param {object} data - Data to save.
 * @returns {Promise<string>} ID of the new document.
 */
async function createDocument(collectionPath, data) {
    try {
        const docRef = await addDoc(collection(db, collectionPath), data);
        return docRef.id;
    } catch (e) {
        console.error("Error creating document: ", e);
        throw new Error("Failed to create document.");
    }
}

/**
 * Updates an existing document.
 * @param {string} collectionPath - Full path of the collection.
 * @param {string} id - Document ID.
 * @param {object} data - Data to update.
 */
async function updateDocument(collectionPath, id, data) {
    try {
        const docRef = doc(db, collectionPath, id);
        await setDoc(docRef, data, { merge: true });
    } catch (e) {
        console.error("Error updating document: ", e);
        throw new Error("Failed to update document.");
    }
}

/**
 * Gets a document by its ID.
 * @param {string} collectionPath - Full path of the collection.
 * @param {string} id - Document ID.
 * @returns {Promise<object | null>} Document data or null.
 */
async function getDocumentById(collectionPath, id) {
    try {
        const docRef = doc(db, collectionPath, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (e) {
        console.error("Error getting document:", e);
        return null;
    }
}

/**
 * Deletes a document by its ID.
 * @param {string} collectionPath - Full path of the collection.
 * @param {string} id - Document ID.
 */
async function deleteDocumentById(collectionPath, id) {
    try {
        await deleteDoc(doc(db, collectionPath, id));
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error("Failed to delete document.");
    }
}

const AppProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [modal, setModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        onConfirm: null,
        isConfirm: false
    });

    useEffect(() => {
        const unsubscribe = initializeAuthAndFirestore(setUserId, setIsAuthReady);
        return () => unsubscribe();
    }, []);

    const showModal = (title, message, onConfirm = null, isConfirm = false) => {
        setModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            isConfirm
        });
    };

    const closeModal = () => {
        setModal({ ...modal, isOpen: false });
    };

    const value = {
        userId,
        isAuthReady,
        showModal,
        closeModal,
        modal,
        db,
        auth,
        // Exported CRUD functions
        getDocumentById,
        updateDocument,
        createDocument,
        deleteDocumentById,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            <ModalComponent 
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                isConfirm={modal.isConfirm}
                onClose={closeModal}
            />
        </AppContext.Provider>
    );
};


// ====================================================================
// ====================== UTILITY COMPONENTS =====================
// ====================================================================

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-dark bg-opacity-75 rounded-xl shadow-2xl mx-auto w-fit">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold text-yellow-300">Cargando...</p>
        </div>
    );
}

function ModalComponent({ isOpen, title, message, onConfirm, isConfirm, onClose }) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark text-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h5 className="text-xl font-bold text-warning">{title}</h5>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-gray-300">{message}</p>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
                    {isConfirm && (
                        <button 
                            onClick={handleClose} 
                            className="btn btn-secondary transition duration-150 ease-in-out hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                    )}
                    <button 
                        onClick={handleConfirm} 
                        className={`btn btn-${isConfirm ? 'danger' : 'primary'} transition duration-150 ease-in-out hover:scale-105`}
                    >
                        {isConfirm ? 'Confirmar' : 'Aceptar'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// ====================================================================
// ============================ VIEW COMPONENTS ==========================
// ====================================================================

// --- 1. NAVBAR ---
function Navbar() {
    const { userId, isAuthReady } = useApp();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg sticky-top bg-opacity-90">
            <div className="container-fluid">
                <Link className="navbar-brand text-warning font-bold text-xl flex items-center" to="/">
                    <i className="fas fa-soap mr-2 text-2xl"></i> SoapManager
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item">
                            <Link className="nav-link text-white hover:text-warning transition" to="/tiendas">
                                <i className="fas fa-store mr-1"></i> Tiendas
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link text-white hover:text-warning transition" to="/jabones">
                                <i className="fas fa-hand-sparkles mr-1"></i> Jabones
                            </Link>
                        </li>
                    </ul>
                    <div className="d-flex text-white text-sm opacity-80 pt-2 lg:pt-0">
                        {isAuthReady ? (
                            <span className="truncate max-w-[150px] md:max-w-full" title={userId}>
                                User ID: {userId}
                            </span>
                        ) : (
                            <span>Autenticando...</span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

// --- 2. HOME ---
function Home() {
    return (
        <div className="container mt-5 flex flex-col items-center justify-center min-h-[70vh]">
            <div className="card text-center p-6 sm:p-10 max-w-2xl">
                <div className="mb-6">
                    <i className="fas fa-soap text-8xl text-warning animate-bounce-slow"></i>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
                    Bienvenido a SoapManager
                </h1>
                <p className="text-lg text-gray-300 mb-6">
                    Tu sistema de gestión de inventario y tiendas de jabones artesanales en tiempo real.
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link 
                        to="/tiendas" 
                        className="btn btn-primary btn-lg shadow-lg hover:scale-105 transition duration-200"
                    >
                        <i className="fas fa-store mr-2"></i> Ver Tiendas
                    </Link>
                    <Link 
                        to="/jabones" 
                        className="btn btn-success btn-lg shadow-lg hover:scale-105 transition duration-200"
                    >
                        <i className="fas fa-hand-sparkles mr-2"></i> Ver Jabones
                    </Link>
                </div>
            </div>
        </div>
    );
}

// --- 3. TIENDAS LIST (List of Stores) ---
function TiendasList() {
    const { userId, isAuthReady, showModal, deleteDocumentById, db } = useApp();
    const [tiendas, setTiendas] = useState([]);
    const [loading, setLoading] = useState(true);

    const TIENDAS_COLLECTION_PATH = getUserCollectionPath(userId, TIENDAS_COLLECTION_NAME);

    useEffect(() => {
        // Run only if authentication is ready and userId is defined
        if (!isAuthReady || !userId) return;

        const q = query(collection(db, TIENDAS_COLLECTION_PATH));
        
        // Real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by name
            list.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            setTiendas(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tiendas:", error);
            showModal("Error de Datos", "No se pudieron cargar las tiendas.", null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady, userId, db, showModal, TIENDAS_COLLECTION_PATH]);

    const handleDelete = (id) => {
        showModal(
            "Confirmar Eliminación", 
            "¿Estás seguro de que quieres eliminar esta tienda?", 
            async () => {
                try {
                    await deleteDocumentById(TIENDAS_COLLECTION_PATH, id);
                    showModal("Éxito", "Tienda eliminada correctamente.", null);
                } catch (error) {
                    console.error("Error deleting tienda:", error);
                    showModal("Error", "Error al eliminar la tienda.", null);
                }
            }, 
            true
        );
    };

    if (!isAuthReady || loading) return <div className="text-center mt-5"><LoadingScreen /></div>;

    return (
        <div className="container mt-5">
            <h2 className="text-white mb-4 text-3xl font-bold">Gestión de Tiendas</h2>
            <div className="d-flex justify-content-end mb-4">
                <Link to="/tiendas/new" className="btn btn-primary shadow-md hover:scale-105 transition duration-200">
                    <i className="fas fa-plus"></i> Registrar Tienda
                </Link>
            </div>

            <div className="card p-4">
                {tiendas.length === 0 ? (
                    <p className="text-center text-gray-400">No hay tiendas registradas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-dark table-hover w-full rounded-lg overflow-hidden">
                            <thead className="bg-warning text-black">
                                <tr>
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">Ubicación</th>
                                    <th className="p-3">Teléfono</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tiendas.map((tienda) => (
                                    <tr key={tienda.id}>
                                        <td className="p-3">{tienda.nombre}</td>
                                        <td className="p-3">{tienda.ubicacion}</td>
                                        <td className="p-3">{tienda.telefono}</td>
                                        <td className="p-3 text-center space-x-2">
                                            <Link 
                                                to={`/tiendas/edit/${tienda.id}`} 
                                                className="btn btn-sm btn-outline-warning"
                                            >
                                                <i className="fas fa-edit"></i> Editar
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(tienda.id)}
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                <i className="fas fa-trash-alt"></i> Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- 4. TIENDAS REGISTER/EDIT ---
function RegistrarTienda() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthReady, showModal, createDocument, updateDocument, getDocumentById, userId } = useApp();
    
    const TIENDAS_COLLECTION_PATH = getUserCollectionPath(userId, TIENDAS_COLLECTION_NAME);

    const [tienda, setTienda] = useState({ nombre: '', ubicacion: '', telefono: '' });
    const [loadingData, setLoadingData] = useState(id ? true : false);
    const isEdit = !!id;

    // Load data if editing
    useEffect(() => {
        if (!isAuthReady || !userId) return;
        if (isEdit) {
            getDocumentById(TIENDAS_COLLECTION_PATH, id).then(data => {
                if (data) {
                    setTienda({ 
                        nombre: data.nombre || '', 
                        ubicacion: data.ubicacion || '', 
                        telefono: data.telefono || '' 
                    });
                } else {
                    showModal("Error", "Tienda no encontrada.", () => navigate('/tiendas'));
                }
                setLoadingData(false);
            }).catch(e => {
                console.error(e);
                showModal("Error de Carga", "Error al cargar los datos de la tienda.", () => navigate('/tiendas'));
            });
        }
    }, [id, isEdit, navigate, isAuthReady, showModal, getDocumentById, TIENDAS_COLLECTION_PATH, userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTienda({ 
            ...tienda, 
            [name]: value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!tienda.nombre || !tienda.ubicacion || !tienda.telefono) {
            showModal("Advertencia", "Todos los campos son obligatorios.", null);
            return;
        }

        try {
            const dataToSave = tienda;
            
            if (isEdit) {
                await updateDocument(TIENDAS_COLLECTION_PATH, id, dataToSave);
                showModal("Éxito", "Tienda actualizada con éxito.", () => navigate('/tiendas'));
            } else {
                await createDocument(TIENDAS_COLLECTION_PATH, dataToSave);
                showModal("Éxito", "Tienda registrada con éxito.", () => navigate('/tiendas'));
            }
        } catch (error) {
            console.error("Error en la operación de Tienda:", error);
            showModal("Error", "Error al guardar la tienda. Consulte la consola para más detalles.", null);
        }
    };

    if (!isAuthReady || loadingData) return <div className="text-center mt-5"><LoadingScreen /></div>;

    return (
        <div className="container mt-5" style={{ maxWidth: '600px' }}>
            <h2 className="text-white mb-4">{isEdit ? 'Editar Tienda' : 'Registrar Nueva Tienda'}</h2>
            <div className="card shadow-lg p-4 bg-dark text-white bg-opacity-75 rounded-xl">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nombre" className="form-label font-bold text-warning">Nombre de la Tienda</label>
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
                        <label htmlFor="ubicacion" className="form-label font-bold text-warning">Ubicación / Dirección</label>
                        <input
                            type="text"
                            className="form-control bg-secondary text-white border-dark rounded-md"
                            id="ubicacion"
                            name="ubicacion"
                            value={tienda.ubicacion}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="telefono" className="form-label font-bold text-warning">Teléfono</label>
                        <input
                            type="tel"
                            className="form-control bg-secondary text-white border-dark rounded-md"
                            id="telefono"
                            name="telefono"
                            value={tienda.telefono}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="d-flex justify-content-between mt-5">
                        <button type="submit" className={`btn btn-${isEdit ? 'warning' : 'primary'} btn-lg shadow-md transition duration-150 ease-in-out hover:scale-105`}>
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

// --- 5. JABONES LIST (List of Soaps) ---
function JabonesList() {
    const { userId, isAuthReady, showModal, deleteDocumentById, db } = useApp();
    const [jabones, setJabones] = useState([]);
    const [loading, setLoading] = useState(true);

    const JABONES_COLLECTION_PATH = getUserCollectionPath(userId, JABONES_COLLECTION_NAME);

    useEffect(() => {
        // Run only if authentication is ready and userId is defined
        if (!isAuthReady || !userId) return;

        const q = query(collection(db, JABONES_COLLECTION_PATH));
        
        // Real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by name
            list.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            setJabones(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jabones:", error);
            showModal("Error de Datos", "No se pudieron cargar los jabones.", null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady, userId, db, showModal, JABONES_COLLECTION_PATH]);

    const handleDelete = (id) => {
        showModal(
            "Confirmar Eliminación", 
            "¿Estás seguro de que quieres eliminar este jabón?", 
            async () => {
                try {
                    await deleteDocumentById(JABONES_COLLECTION_PATH, id);
                    showModal("Éxito", "Jabón eliminado correctamente.", null);
                } catch (error) {
                    console.error("Error deleting jabon:", error);
                    showModal("Error", "Error al eliminar el jabón.", null);
                }
            }, 
            true
        );
    };

    if (!isAuthReady || loading) return <div className="text-center mt-5"><LoadingScreen /></div>;

    return (
        <div className="container mt-5">
            <h2 className="text-white mb-4 text-3xl font-bold">Gestión de Jabones</h2>
            <div className="d-flex justify-content-end mb-4">
                <Link to="/jabones/new" className="btn btn-success shadow-md hover:scale-105 transition duration-200">
                    <i className="fas fa-plus"></i> Registrar Jabón
                </Link>
            </div>

            <div className="card p-4">
                {jabones.length === 0 ? (
                    <p className="text-center text-gray-400">No hay jabones registrados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-dark table-hover w-full rounded-lg overflow-hidden">
                            <thead className="bg-success text-white">
                                <tr>
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">Aroma</th>
                                    <th className="p-3">Precio</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jabones.map((jabon) => (
                                    <tr key={jabon.id}>
                                        <td className="p-3">{jabon.nombre}</td>
                                        <td className="p-3">{jabon.aroma}</td>
                                        <td className="p-3">${parseFloat(jabon.precio).toFixed(2)}</td>
                                        <td className="p-3 text-center space-x-2">
                                            <Link 
                                                to={`/jabones/edit/${jabon.id}`} 
                                                className="btn btn-sm btn-outline-warning"
                                            >
                                                <i className="fas fa-edit"></i> Editar
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(jabon.id)}
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                <i className="fas fa-trash-alt"></i> Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- 6. JABONES REGISTER/EDIT (User provided component) ---
function RegistrarJabon() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthReady, showModal, createDocument, updateDocument, getDocumentById, userId } = useApp();
    
    const JABONES_COLLECTION_PATH = getUserCollectionPath(userId, JABONES_COLLECTION_NAME);

    const [jabon, setJabon] = useState({ nombre: '', aroma: '', precio: '' });
    const [loadingData, setLoadingData] = useState(id ? true : false);
    const isEdit = !!id;

    // Load data if editing
    useEffect(() => {
        if (!isAuthReady || !userId) return;
        if (isEdit) {
            getDocumentById(JABONES_COLLECTION_PATH, id).then(data => {
                if (data) {
                    setJabon({ 
                        nombre: data.nombre || '', 
                        aroma: data.aroma || '', 
                        // Use string format for input value
                        precio: (data.precio !== undefined && data.precio !== null) ? String(data.precio) : '' 
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
    }, [id, isEdit, navigate, isAuthReady, showModal, getDocumentById, JABONES_COLLECTION_PATH, userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setJabon({ 
            ...jabon, 
            [name]: value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const priceValue = parseFloat(jabon.precio);

        // Basic validation
        if (!jabon.nombre || !jabon.aroma || isNaN(priceValue) || priceValue <= 0) {
            showModal("Advertencia", "El nombre, aroma y un precio válido mayor a 0 son obligatorios.", null);
            return;
        }

        try {
            // Ensure price is a number before saving (Firestore)
            const dataToSave = { 
                nombre: jabon.nombre,
                aroma: jabon.aroma,
                precio: priceValue,
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
                            // Value must be a string for controlled number input in React
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
// ============================= MAIN APP ============================
// ====================================================================

function App() {
    return (
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
            
            {/* Load Bootstrap and FontAwesome CSS for user classes */}
            <link 
                rel="stylesheet" 
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
                xintegrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
                crossOrigin="anonymous" 
            />
            {/* Script for Bootstrap JS (for the navbar-toggler) */}
            <script 
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
                xintegrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
                crossOrigin="anonymous"
            ></script>

            {/* User CSS styles for animated background and overrides */}
            <style>{`
                /* Global styles */
                @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                
                html, body, #root, .animated-background {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    font-family: 'Inter', sans-serif;
                }
                
                /* Animated Gradient Background: Modern and attractive style */
                .animated-background {
                    min-height: 100vh;
                    width: 100%;
                    /* Custom background to resemble a foamy soap look */
                    background: linear-gradient(
                        -45deg,
                        #4a90e2, /* Blue like water */
                        #d0f0c0, /* Light green/mint for fresh scent */
                        #f9d3b4, /* Soft beige/peach for natural ingredients */
                        #ffffff, /* White foamy look */
                        #4a90e2
                    );
                    background-size: 400% 400%; 
                    animation: gradientAnimation 20s ease infinite; 
                }

                /* Gradient movement animation */
                @keyframes gradientAnimation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                /* Main Content */
                .main-content {
                    position: relative; 
                    z-index: 1; 
                    padding-top: 20px; 
                    padding-bottom: 50px;
                }
                
                /* Floating soap icon in Home */
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
                
                /* Focus style for inputs */
                .form-control.bg-secondary:focus {
                    background-color: #444 !important; /* Darker secondary on focus */
                    border-color: #ffc107 !important;
                    box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.4) !important; /* Brighter shadow */
                }

                /* Styles for cards and tables */
                .card {
                    border-radius: 1rem !important;
                    backdrop-filter: blur(8px); /* Increased blur for better contrast */
                    background-color: rgba(33, 37, 41, 0.9) !important; /* Slightly more opaque dark background */
                    border: 1px solid rgba(255, 255, 255, 0.1);
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

// Single export of the application
export default App;