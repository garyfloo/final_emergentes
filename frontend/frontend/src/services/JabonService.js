/*
import axios from "axios";

const API_URL = "http://localhost:8080/jabones";

class JabonService {
    getJabones() {
        return axios.get(API_URL);
    }
}

export default new JabonService();
*/

// src/services/JabonService.js
import axios from "axios";

// CORRECCIÓN: Agregar /api para alinearse con el Backend
const API = "http://localhost:8080/api/jabones"; 

class JabonService {

    // Obtener todos
    getJabones() {
        return axios.get(API);
    }

    // Obtener 1 por ID
    getJabonById(id) {
        return axios.get(`${API}/${id}`);
    }

    // Crear
    createJabon(data) {
        return axios.post(API, data);
    }

    // Actualizar
    updateJabon(id, data) {
        return axios.put(`${API}/${id}`, data);
    }

    // Eliminar
    deleteJabon(id) {
        return axios.delete(`${API}/${id}`);
    }
}

export default new JabonService();

