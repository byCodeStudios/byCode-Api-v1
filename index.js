import express from 'express';
import { promises as fs } from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta / redirecciona a /api/status
app.get('/', (req, res) => {
    res.redirect('/api/status');
});

// Función para verificar el estado y tiempo de respuesta de cada servicio
const checkStatus = async (service) => {
    try {
        const startTime = Date.now();
        const response = await axios.get(`http://${service.ip}/`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        return {
            name: service.name,
            ip: service.ip,
            status: response.status === 200 ? 'Running' : 'Down',
            responseTime: responseTime // Agregamos el tiempo de respuesta al objeto de respuesta
        };
    } catch (error) {
        console.error(`Error al verificar ${service.name} en ${service.ip}:`, error.message);
        return {
            name: service.name,
            ip: service.ip,
            status: 'Error',
            responseTime: null // En caso de error, el tiempo de respuesta será null
        };
    }
};

// Ruta /api/status
app.get('/api/status', async (req, res) => {
    try {
        const data = await fs.readFile(join(__dirname, 'services.json'), 'utf8');
        const services = JSON.parse(data);

        // Función para actualizar el estado de todos los servicios
        const updateStatus = async () => {
            const results = await Promise.all(services.map(checkStatus));
            res.json({
                status: 'OK',
                services: results
            });
        };

        // Llamar a la función de actualización de estado inicialmente
        await updateStatus();

        // Actualizar el estado cada 5 segundos
        setInterval(updateStatus, 5000);

    } catch (err) {
        console.error('Error al procesar la solicitud:', err);
        res.status(500).json({ status: 'Error', message: err.message });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
    
