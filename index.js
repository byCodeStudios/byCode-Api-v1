import express from 'express';
import { promises as fs } from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'; // Importar 'path' correctamente

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta / redirecciona a /api/status
app.get('/', (req, res) => {
    res.redirect('/api/status');
});

// Ruta /api/status
app.get('/api/status', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'services.json'), 'utf8'); // Usar 'path.join' correctamente
        const services = JSON.parse(data);

        const checkStatus = async (service) => {
            try {
                // Realizar solicitud HTTP para verificar el estado del servicio
                const response = await axios.get(`http://${service.ip}/`);
                return {
                    name: service.name,
                    ip: service.ip,
                    status: response.status === 200 ? 'Running' : 'Down'
                };
            } catch (error) {
                console.error(`Error al verificar ${service.name} en ${service.ip}:`, error.message);
                return {
                    name: service.name,
                    ip: service.ip,
                    status: 'Error'
                };
            }
        };

        const updateStatus = async () => {
            const results = await Promise.all(services.map(checkStatus));
            res.json({
                status: 'OK',
                services: results
            });
        };

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
            
