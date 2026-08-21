const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;

// Mfumo wa kuruhusu seva ipokee data za mtindo wa JSON
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Anzisha au fungua Hifadhidata (Database) ya SQLite
const db = new sqlite3.Database('./vifaa.db', (err) => {
    if (err) {
        console.error("Imeshindwa kufungua database:", err.message);
    } else {
        console.log("Database imeunganishwa kikamilifu.");
    }
});

// Tengeneza jedwali la kuhifadhi vifaa kama halipo
db.run(`CREATE TABLE IF NOT EXISTS maeneo (
    id TEXT PRIMARY KEY,
    jina_la_kifaa TEXT,
    latitude REAL,
    longitude REAL,
    muda_wa_sasa TEXT
)`);

// 1. ENDPOINT YA KUPOKEA DATA (Kutoka kwenye Simu/App)
app.post('/api/update-location', (req, res) => {
    const { id, jina_la_kifaa, latitude, longitude } = req.body;
    const muda = new Date().toISOString();

    const sql = `INSERT INTO maeneo (id, jina_la_kifaa, latitude, longitude, muda_wa_sasa)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET 
                 jina_la_kifaa=excluded.jina_la_kifaa,
                 latitude=excluded.latitude, 
                 longitude=excluded.longitude, 
                 muda_wa_sasa=excluded.muda_wa_sasa`;

    db.run(sql, [id, jina_la_kifaa, latitude, longitude, muda], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Eneo la kifaa limebadirishwa kikamilifu!" });
    });
});

// 2. ENDPOINT YA KUTOA DATA YA KIFAA KIMOJA (Kwa ajili ya Ramani)
app.get('/api/get-location/:id', (req, res) => {
    const kifaaId = req.params.id;
    const sql = `SELECT * FROM maeneo WHERE id = ?`;

    db.get(sql, [kifaaId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: "Kifaa hakijapatikana." });
        }
        res.json(row);
    });
});

// 3. ENDPOINT YA KUTOA ORODHA YA VIFAA VYOTE (Kwa ajili ya Dropdown ya Dashboard)
app.get('/api/get-all-devices', (req, res) => {
    db.all("SELECT id, jina_la_kifaa, muda_wa_sasa FROM maeneo", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ vifaa: rows });
    });
});

// Washa Seva
app.listen(PORT, () => {
    console.log(`Seva inakimbia kwenye port ${PORT}`);
});