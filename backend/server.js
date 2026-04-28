// Importo mis variables de entorno desde mi archivo .env
require('dotenv').config();

// Importo las librerías que necesito para mi servidor
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

// Inicializo mi aplicación Express
const app = express();

// Configuro los middlewares: CORS para permitir peticiones del frontend y JSON para leer los bodys
app.use(cors());
app.use(express.json());

// Configuro mi conexión a la base de datos Neon usando la URL de mi .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Permito certificados no autorizados porque es un requisito común en conexiones SSL de Neon/servicios cloud
    ssl: { rejectUnauthorized: false }
});

// ---------------------------------------------------------
// 1. MI ENDPOINT DE SOLICITUD (POST) [cite: 10]
// ---------------------------------------------------------
app.post('/api/solicitar-acceso', async (req, res) => {
    // Extraigo el email y el folio que me manda mi frontend
    const { email, folio } = req.body;

    // Valido que el correo pertenezca estrictamente a mi institución
    if (!email.endsWith('@itses.edu.mx')) {
        return res.status(400).json({ error: 'Correo inválido. Solo permito el dominio @itses.edu.mx' });
    }

    try {
        // Inserto la nueva solicitud en mi base de datos con estatus inicial de "Procesando"
        await pool.query(
            'INSERT INTO solicitudes (email, folio, estatus) VALUES ($1, $2, $3)', 
            [email, folio, 'Procesando']
        );
        
        // Defino la URL de mi webhook de n8n que procesará la automatización
        const n8nWebhookUrl = 'http://localhost:5678/webhook/webhook-gatekeeper'; 
        
        // Disparo el webhook mandando los datos a n8n
        await axios.post(n8nWebhookUrl, { email, folio });

        // Le respondo a mi frontend que todo salió bien
        res.status(200).json({ message: 'Solicitud registrada y enviada a n8n con éxito' });
    } catch (error) {
        console.error("Error en solicitar-acceso:", error);
        res.status(500).json({ error: 'Ocurrió un error al procesar mi solicitud' });
    }
});

// ---------------------------------------------------------
// 2. MI ENDPOINT DE VERIFICACIÓN / POLLING (GET) [cite: 11]
// ---------------------------------------------------------
app.get('/api/verificar-estatus/:email', async (req, res) => {
    // Extraigo el email de los parámetros de la URL
    const { email } = req.params;
    
    try {
        // Busco en mi base de datos el estatus más reciente de este correo
        const result = await pool.query(
            'SELECT estatus FROM solicitudes WHERE email = $1 ORDER BY id DESC LIMIT 1', 
            [email]
        );
        
        // Si encuentro la solicitud, devuelvo su estatus actual
        if (result.rows.length > 0) {
            res.json({ estatus: result.rows[0].estatus });
        } else {
            res.status(404).json({ error: 'No encontré ninguna solicitud con este correo' });
        }
    } catch (error) {
        console.error("Error en verificar-estatus:", error);
        res.status(500).json({ error: 'Ocurrió un error al verificar mi estatus' });
    }
});

// ---------------------------------------------------------
// 3. MI ENDPOINT DE CALLBACK PARA N8N (PATCH) [cite: 12]
// ---------------------------------------------------------
app.patch('/api/callback', async (req, res) => {
    // Recibo el email y el nuevo estatus ("Aceptado" o "Denegado") que me manda n8n
    const { email, nuevoEstatus } = req.body;
    
    try {
        // Actualizo el estatus en mi tabla de solicitudes
        await pool.query(
            'UPDATE solicitudes SET estatus = $1 WHERE email = $2', 
            [nuevoEstatus, email]
        );
        res.status(200).json({ message: 'Estatus actualizado correctamente por n8n' });
    } catch (error) {
        console.error("Error en callback:", error);
        res.status(500).json({ error: 'Ocurrió un error al actualizar mi estatus' });
    }
});

// ---------------------------------------------------------
// ARRANQUE DEL SERVIDOR
// ---------------------------------------------------------
// Uso el puerto de mi .env o el 3001 por defecto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Mi servidor backend está corriendo felizmente en el puerto ${PORT}`);
});