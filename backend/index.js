require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.post('/api/solicitar-acceso', async (req, res) => {
    const { email, folio } = req.body;

    try {
        const query = `
            INSERT INTO solicitudes (email, folio, estatus) 
            VALUES ($1, $2, 'Procesando')
            ON CONFLICT (email) DO UPDATE 
            SET folio = EXCLUDED.folio, estatus = 'Procesando'
            RETURNING *;
        `;
        const result = await pool.query(query, [email, folio]);
        const nuevaSolicitud = result.rows[0];

        axios.post(process.env.N8N_WEBHOOK_URL, { email, folio })
            .catch(err => console.error(err.message));

        res.status(201).json({ mensaje: 'Solicitud registrada', solicitud: nuevaSolicitud });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar la solicitud' });
    }
});

app.get('/api/verificar-estatus/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const result = await pool.query('SELECT estatus FROM solicitudes WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.json({ estatus: result.rows[0].estatus });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar estatus' });
    }
});

app.patch('/api/actualizar-estatus', async (req, res) => {
    const { email, estatus } = req.body; 
    try {
        const result = await pool.query(
            'UPDATE solicitudes SET estatus = $1 WHERE email = $2 RETURNING *',
            [estatus, email]
        );
        res.json({ mensaje: 'Estatus actualizado', solicitud: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar estatus' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en el puerto ${PORT}`));