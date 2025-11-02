// --- Imports ---
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose(); // Use verbose for more detailed logs
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Configuration ---
const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-super-secret-key-change-this'; // CHANGE THIS!
const db = new sqlite3.Database('./sweets.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- Database Initialization ---
// This function creates your tables and a default admin user
async function initializeDatabase() {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'USER'
        );
    `;
    const createSweetsTable = `
        CREATE TABLE IF NOT EXISTS sweets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL
        );
    `;

    db.serialize(() => {
        db.run(createUsersTable, (err) => {
            if (err) console.error("Error creating users table:", err);
        });
        db.run(createSweetsTable, (err) => {
            if (err) console.error("Error creating sweets table:", err);
        });

        // Create a default admin user (if they don't exist)
        const adminUsername = 'admin';
        const adminPassword = 'password123';
        
        db.get('SELECT * FROM users WHERE username = ?', [adminUsername], async (err, user) => {
            if (!user) {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
                       [adminUsername, hashedPassword, 'ADMIN'], (err) => {
                    if (err) {
                        console.error("Error creating admin user:", err);
                    } else {
                        console.log('=========================================');
                        console.log('Admin user created: admin / password123');
                        console.log('=========================================');
                    }
                });
            }
        });
    });
}

// --- Auth Middleware ---
// This function protects your routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
        req.user = user; // Add the user payload (id, username, role) to the request
        next();
    });
};

// Middleware to check if user is an Admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin role required' });
    }
    next();
};

// --- API Endpoints ---

// 1. Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        
        db.run(sql, [username, hashedPassword, 'USER'], function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ message: 'Username already taken' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.get(sql, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            accessToken: token,
            user: payload
        });
    });
});

// 2. Sweets Endpoints (Protected)
app.post('/api/sweets', authenticateToken, isAdmin, (req, res) => {
    const { name, category, price, quantity } = req.body;
    const sql = 'INSERT INTO sweets (name, category, price, quantity) VALUES (?, ?, ?, ?)';
    db.run(sql, [name, category, price, quantity], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error adding sweet' });
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});

app.get('/api/sweets', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM sweets';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching sweets' });
        }
        res.json(rows);
    });
});

app.get('/api/sweets/search', authenticateToken, (req, res) => {
    const { name, category, minPrice, maxPrice } = req.query;
    
    let sql = 'SELECT * FROM sweets WHERE 1 = 1';
    const params = [];

    if (name) {
        sql += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }
    if (category) {
        sql += ' AND category LIKE ?';
        params.push(`%${category}%`);
    }
    if (minPrice) {
        sql += ' AND price >= ?';
        params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
        sql += ' AND price <= ?';
        params.push(parseFloat(maxPrice));
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error searching sweets' });
        }
        res.json(rows);
    });
});

app.put('/api/sweets/:id', authenticateToken, isAdmin, (req, res) => {
    const { name, category, price, quantity } = req.body;
    const { id } = req.params;
    const sql = 'UPDATE sweets SET name = ?, category = ?, price = ?, quantity = ? WHERE id = ?';
    db.run(sql, [name, category, price, quantity, id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating sweet' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        res.json({ message: 'Sweet updated successfully' });
    });
});

app.delete('/api/sweets/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM sweets WHERE id = ?';
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting sweet' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        res.json({ message: 'Sweet deleted successfully' });
    });
});

// 3. Inventory Endpoints (Protected)
app.post('/api/sweets/:id/purchase', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT quantity FROM sweets WHERE id = ?', [id], (err, sweet) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (!sweet) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        if (sweet.quantity <= 0) {
            return res.status(400).json({ message: 'Out of stock' });
        }

        const newQuantity = sweet.quantity - 1;
        const sql = 'UPDATE sweets SET quantity = ? WHERE id = ?';
        db.run(sql, [newQuantity, id], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Error processing purchase' });
            }
            res.json({ message: 'Purchase successful', newQuantity });
        });
    });
});

app.post('/api/sweets/:id/restock', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Restock quantity must be a positive number' });
    }

    const sql = 'UPDATE sweets SET quantity = quantity + ? WHERE id = ?';
    db.run(sql, [quantity, id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error restocking sweet' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        db.get('SELECT quantity FROM sweets WHERE id = ?', [id], (err, sweet) => {
            res.json({ message: 'Restock successful', newQuantity: sweet ? sweet.quantity : 0 });
        });
    });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
