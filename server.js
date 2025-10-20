// server.js
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const express = require('express'); // Require the express module
const app = express(); // Create an instance of the Express application
const port = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // In production, set secure: true with HTTPS

}));
app.use(express.static(path.join(__dirname, 'public')));
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();  // User is logged in, proceed
    } else {
        res.redirect('/login');  // User is not logged in, redirect to login
    }
}

const initDB = async () => {
    const db = await open({
        filename: 'database.db',
        driver: sqlite3.Database
    });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
        `);
        
        await db.exec(`CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        bill_date TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL NOT NULL,
        oldGold INTEGER,
        amount_paid REAL NOT NULL,
        balance_amount REAL NOT NULL
         )
        `);
        await  db.exec(`CREATE TABLE IF NOT EXISTS deposit_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            deposit_date TEXT NOT NULL,
            amount_deposited REAL NOT NULL
        )`);
        await db.exec(`CREATE TABLE IF NOT EXISTS bill_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            item_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            amount_per_gram REAL NOT NULL,
            item_description TEXT,
            total_amount REAL NOT NULL,
            FOREIGN KEY (bill_id) REFERENCES bills(id)
        )
        `);
        await db.exec(`CREATE TABLE IF NOT EXISTS billing_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            bill_date TEXT NOT NULL,
            bill_number TEXT NOT NULL,
            total_amount REAL NOT NULL,
            amount_paid REAL NOT NULL,
            balance_amount REAL NOT NULL
        )`);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS bill_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_number INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            item_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            total_price REAL NOT NULL,
            FOREIGN KEY (bill_number) REFERENCES bills (bill_number)
        )`) ;
        await db.exec(`CREATE TABLE IF NOT EXISTS sub_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_number INTEGER,
            sub_bill_number TEXT,
            amount_paid REAL,
            payment_date TEXT,
            FOREIGN KEY (bill_number) REFERENCES bills (bill_number)
        )`);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS gold_stock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gold_type TEXT NOT NULL,
                quantity REAL NOT NULL
            )
        `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS gold_stock_mass (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gold_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                date_added TEXT
            )
        `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS silver_stock_mass (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                silver_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                date_added TEXT
            )
        `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sub_bills_old (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_number REAL,
            sub_bill_id TEXT,
            amount_paid REAL,
            payment_date TEXT
         )`);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sold_gold_stock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gold_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                customer_name TEXT NOT NULL,
                date_sold TEXT NOT NULL
            )
        `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            num_items INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
                await db.exec(`CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id INTEGER,
                item_type TEXT NOT NULL,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                melting TEXT NOT NULL,
                FOREIGN KEY (transaction_id) REFERENCES transactions (id)
            );
                    `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS amount_given (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            amount_given DECIMAL(10, 2) NOT NULL,
            description TEXT NOT NULL
        )`);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sold_gold_stock_mass (
                id INTEGER NOT NULL,
                gold_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                customer_name TEXT NOT NULL,
                date_sold TEXT NOT NULL,
                sub_item_id TEXT NOT NULL,
                bill_number INTEGER NOT NULL
            )
        `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sold_silver_stock_mass (
                id INTEGER NOT NULL,
                silver_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                customer_name TEXT NOT NULL,
                date_sold TEXT NOT NULL,
                sub_item_id TEXT NOT NULL,
                bill_number INTEGER NOT NULL
            )
        `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                item_name TEXT NOT NULL,
                quantity DECIMAL(10,2) NOT NULL,
                amount_per_gram DECIMAL(10,2) NOT NULL,
                making_charges DECIMAL(10,2) NOT NULL,
                wastage DECIMAL(10,2) NOT NULL,
                item_description TEXT,
                total_amount DECIMAL(10,2) NOT NULL,
                delivery_status TEXT DEFAULT 'pending',
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(15) NOT NULL,
                order_date DATETIME NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                advance_payment DECIMAL(10, 2) NOT NULL,
                balance_amount DECIMAL(10, 2) NOT NULL
            )
        `);
        await db.exec(`
           CREATE TABLE if not exists advance_payment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    sub_id TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

        `);
        // await db.exec(`
        //     ALTER TABLE bill_items ADD COLUMN  wastage INT;
        // `);
        
        // await db.exec(`
        //     ALTER TABLE bills ADD COLUMN image BLOB
        // `);
        // await db.exec(`
        //     ALTER TABLE order_items ADD COLUMN  sub_id varchar(10)
        // `);
    return db;
};

// Initialize new database for storing bill images
const initImageDB = async () => {
    const db = await open({
        filename: "bill_images.db",
        driver: sqlite3.Database,
    });

    // Create table if not exists
    await db.exec(`
        CREATE TABLE IF NOT EXISTS bill_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_number TEXT NOT NULL,
            image BLOB NOT NULL
        )
    `);

    return db;
};
const initOrderImageDB = async () => {
    const db = await open({
        filename: "order_images.db",
        driver: sqlite3.Database,
    });

    // Create table if not exists
    await db.exec(`
        CREATE TABLE IF NOT EXISTS order_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            sub_id TEXT NOT NULL,
            image BLOB NOT NULL
        )
    `);

    return db;
};

// Upload images and store them in the new database
app.post("/upload-old-bill", upload.array("billImages", 5), async (req, res) => {
    const { billNumber } = req.body;

    if (!req.files || req.files.length === 0 || !billNumber) {
        return res.status(400).json({ success: false, message: "Missing files or bill number" });
    }

    try {
        const db = await initImageDB();
        const stmt = await db.prepare("INSERT INTO bill_images (bill_number, image) VALUES (?, ?)");

        for (const file of req.files) {
            await stmt.run(billNumber, file.buffer);
        }

        await stmt.finalize();
        res.json({ success: true, message: "Bill Images Uploaded Successfully!" });
    } catch (err) {
        console.error("Error inserting images:", err);
        res.status(500).json({ success: false, message: "Database insert failed" });
    }
});

// Retrieve images for a specific bill number
app.get("/bill-images/:billNumber", async (req, res) => {
    const billNumber = req.params.billNumber;

    try {
        const db = await initImageDB();
        const rows = await db.all("SELECT image FROM bill_images WHERE bill_number = ?", [billNumber]);

        if (rows.length > 0) {
            const images = rows.map(row => row.image.toString("base64"));
            res.json({ success: true, images });
        } else {
            res.status(404).json({ success: false, message: "No images found" });
        }
    } catch (err) {
        console.error("Error fetching bill images:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});
// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;

    // Check for lockout
    if (req.session.lockedOut) {
        const timeLeft = req.session.lockedOut - Date.now();
        if (timeLeft > 0) {
            return res.send(`You are locked out. Please try again in ${Math.ceil(timeLeft / 60000)} minutes.`);
        } else {
            req.session.lockedOut = null; // Clear lockout after timeout
            req.session.failedAttempts = 0; // Reset attempts after lockout
        }
    }

    if (!username || !password || !role) {
        return res.send('Please provide username, password, and role. <a href="/login">Try again</a>');
    }

    const db = await initDB();
    const user = await db.get('SELECT * FROM users WHERE username = ? AND role = ?', [username, role]);

    // Validate credentials
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user; // Store user info in session
        req.session.failedAttempts = 0; // Reset failed attempts on successful login
        if (role === 'admin') {
            res.redirect('/admin-welcome');
        } else {
            res.redirect('/dashboard');
        }
    } else {
        // Increment failed attempts
        req.session.failedAttempts = (req.session.failedAttempts || 0) + 1;

        // Lock the account after 2 failed attempts
        if (req.session.failedAttempts >= 2) {
            req.session.lockedOut = Date.now() + 30 * 60 * 1000; // Lock out for 30 minutes
            return res.send('Too many failed login attempts. You are locked out for 30 minutes. <a href="/login">Try again after 30 minutes</a>');
        }

        res.send('Invalid username or password. <a href="/login">Try again</a>');
    }
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('Error logging out.');
        }
        res.redirect('/login');
    });
});


// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the admin welcome page
app.get('/admin-welcome',isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'admin-welcome.html'));
    } else {
        res.redirect('/login');
    }
});

// Serve the Add Gold Stock page
app.get('/add-stock-gold',isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'add-stock-gold.html'));
    } else {
        res.redirect('/login');
    }
});

// Serve the View Stock Gold page
app.get('/view-stock-gold',isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'view-stock-gold.html'));
    } else {
        res.redirect('/login');
    }
});
app.get('/dashboard', isAuthenticated, (req, res) => {
    if (req.session.user.role === 'user') {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});


// Handle adding gold stock
app.post('/add-stock',isAuthenticated, async (req, res) => {
    const { goldType, quantity } = req.body;

    if (!goldType || quantity === undefined) {
        return res.send('Please provide gold type and quantity. <a href="/add-stock-gold">Try again</a>');
    }

    const db = await initDB();

    try {
        await db.run('INSERT INTO gold_stock (gold_type, quantity,date_added) VALUES (?, ?,?)', [goldType, quantity, new Date().toISOString()]);
        res.redirect('/add-stock-gold?success=true'); // Redirect with success=true
    } catch (error) {
        console.error('Error adding stock:', error); // Log the error for debugging
        res.send('Error adding stock. <a href="/add-stock-gold">Try again</a>');
    }
});

// Serve the Add Silver Stock page
app.get('/add-stock-silver',isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'add-stock-silver.html'));
    } else {
        res.redirect('/login');
    }
});

// Serve the View Stock Silver page
app.get('/view-stock-silver',isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'view-stock-silver.html'));
    } else {
        res.redirect('/login');
    }
});

// Handle adding silver stock
app.post('/add-stock-silver',isAuthenticated, async (req, res) => {
    const { silverType, quantity } = req.body;

    if (!silverType || quantity === undefined) {
        return res.send('Please provide silver type and quantity. <a href="/add-stock-silver">Try again</a>');
    }

    const db = await initDB();

    try {
        await db.run('INSERT INTO silver_stock (silver_type, quantity,date_added) VALUES (?, ?,?)', [silverType, quantity, new Date().toISOString()]);
        res.redirect('/add-stock-silver?success=true'); // Redirect with success=true
    } catch (error) {
        console.error('Error adding silver stock:', error); // Log the error for debugging
        res.send('Error adding silver stock. <a href="/add-stock-silver">Try again</a>');
    }
});

// API Endpoint to Fetch Silver Stock Data
app.get('/view-stock-data-silver',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const stock = await db.all('SELECT * FROM silver_stock');
            res.json(stock);
        } catch (error) {
            console.error('Error fetching silver stock data:', error);
            res.status(500).json({ error: 'Failed to fetch silver stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

app.get('/view-stock-data-silver-mass',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const stock = await db.all('SELECT * FROM silver_stock_mass');
            res.json(stock);
        } catch (error) {
            console.error('Error fetching silver stock data:', error);
            res.status(500).json({ error: 'Failed to fetch silver stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});


// API Endpoint to Fetch Stock Data
app.get('/view-stock-data',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const stock = await db.all('SELECT * FROM gold_stock');
            res.json(stock);
        } catch (error) {
            console.error('Error fetching stock data:', error);
            res.status(500).json({ error: 'Failed to fetch stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Fetch Stock Data mass
app.get('/view-stock-data-mass',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const stock = await db.all('SELECT * FROM gold_stock_mass');
            res.json(stock);
        } catch (error) {
            console.error('Error fetching stock data:', error);
            res.status(500).json({ error: 'Failed to fetch stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Delete Gold Stock Data
app.delete('/delete-stock-gold/:id',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        const { id } = req.params;
        try {
            const result = await db.run('DELETE FROM gold_stock WHERE id = ?', [id]);
            if (result.changes === 0) {
                return res.status(404).json({ error: 'Gold stock item not found' });
            }
            res.status(200).json({ message: 'Gold stock item deleted successfully' });
        } catch (error) {
            console.error('Error deleting gold stock item:', error);
            res.status(500).json({ error: `Failed to delete gold stock item: ${error.message}` });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Delete Gold mass Data
app.delete('/delete-stock-gold-mass/:id',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        const { id } = req.params;
        try {
            const result = await db.run('DELETE FROM gold_stock_mass WHERE id = ?', [id]);
            if (result.changes === 0) {
                return res.status(404).json({ error: 'Gold stock item not found' });
            }
            res.status(200).json({ message: 'Gold stock item deleted successfully' });
        } catch (error) {
            console.error('Error deleting gold stock item:', error);
            res.status(500).json({ error: `Failed to delete gold stock item: ${error.message}` });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});
// API Endpoint to Delete Silver Stock Data
app.delete('/delete-stock-silver/:id',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        const { id } = req.params;
        try {
            const result = await db.run('DELETE FROM silver_stock WHERE id = ?', [id]);
            if (result.changes === 0) {
                return res.status(404).json({ error: 'Silver stock item not found' });
            }
            res.status(200).json({ message: 'Silver stock item deleted successfully' });
        } catch (error) {
            console.error('Error deleting silver stock item:', error);
            res.status(500).json({ error: `Failed to delete silver stock item: ${error.message}` });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

app.delete('/delete-stock-silver-mass/:id', isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        const { id } = req.params;
        try {
            const result = await db.run('DELETE FROM silver_stock_mass WHERE id = ?', [id]); // Change table name accordingly
            if (result.changes === 0) {
                return res.status(404).json({ error: 'Mass silver stock item not found' });
            }
            res.status(200).json({ message: 'Mass silver stock item deleted successfully' });
        } catch (error) {
            console.error('Error deleting mass silver stock item:', error);
            res.status(500).json({ error: `Failed to delete mass silver stock item: ${error.message}` });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Fetch Item Details (Gold)
app.get('/item-details-gold/:id',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        const { id } = req.params;
        try {
            const item = await db.get('SELECT * FROM gold_stock WHERE id = ?', [id]);
            res.json(item);
        } catch (error) {
            console.error('Error fetching item details:', error);
            res.status(500).json({ error: 'Failed to fetch item details' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Fetch Item Details (Silver)
app.get('/item-details-silver/:id',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        const { id } = req.params;
        try {
            const item = await db.get('SELECT * FROM silver_stock WHERE id = ?', [id]);
            res.json(item);
        } catch (error) {
            console.error('Error fetching item details:', error);
            res.status(500).json({ error: 'Failed to fetch item details' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Fetch Sold Gold Stock Data
app.get('/view-sold-gold-stock',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const soldStock = await db.all('SELECT * FROM sold_gold_stock ORDER BY date_sold desc ');
            res.json(soldStock);
        } catch (error) {
            console.error('Error fetching sold gold stock data:', error);
            res.status(500).json({ error: 'Failed to fetch sold gold stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

app.get('/view-sold-gold-stock-mass',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const soldStock = await db.all('SELECT * FROM sold_gold_stock_mass ORDER BY date_sold desc ');
            res.json(soldStock);
        } catch (error) {
            console.error('Error fetching sold gold stock data:', error);
            res.status(500).json({ error: 'Failed to fetch sold gold stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Fetch Sold Silver Stock Data
app.get('/view-sold-silver-stock',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const soldStock = await db.all('SELECT * FROM sold_silver_stock_new order by date_sold desc');
            res.json(soldStock);
        } catch (error) {
            console.error('Error fetching sold silver stock data:', error);
            res.status(500).json({ error: 'Failed to fetch sold silver stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

// API Endpoint to Fetch Sold Silver Stock Data
app.get('/view-sold-silver-stock-mass',isAuthenticated, async (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const db = await initDB();
        try {
            const soldStock = await db.all('SELECT * FROM sold_silver_stock_mass order by date_sold desc');
            res.json(soldStock);
        } catch (error) {
            console.error('Error fetching sold silver stock data:', error);
            res.status(500).json({ error: 'Failed to fetch sold silver stock data' });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});

app.post('/generate-bill',isAuthenticated, async (req, res) => {
    const { billNumber, customerName, customerPhone, items, subtotal, discount,oldGold, amountPaid, oldBalance, balanceAmount } = req.body;

    if (!billNumber || !customerName || !customerPhone || !items.length || isNaN(subtotal) || isNaN(discount) || isNaN(amountPaid)) {
        return res.status(400).send('Invalid data provided. <a href="/generate-bill">Try again</a>');
    }

    const db = await initDB();

    try {
        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Insert bill including bill_date
        await db.run('INSERT INTO bills (bill_number, customer_name, customer_phone, subtotal, discount,oldGold, amount_paid,old_balance, balance_amount, bill_date) VALUES (?, ?, ?, ?, ?, ? ,?,?,?, ?)', [
            billNumber,
            customerName,
            customerPhone,
            subtotal,
            discount,
            oldGold,
            amountPaid,
            oldBalance,
            balanceAmount,
            new Date().toISOString() // Adding the bill_date with current timestamp
        ]);
     
        const subBillNumber = "First Payment";
        await db.run('INSERT INTO sub_bills (bill_number, sub_bill_number, amount_paid,payment_date) VALUES (?, ?, ?, ?)',[
            billNumber,       // Bill number
            subBillNumber,    // Initial sub-bill number
            amountPaid,       // Amount paid
            new Date().toISOString() // Current timestamp as bill_date
        ]);


        // Insert bill items and move items to sold stock
        var index=0;
        for (const item of items) {
            const subItemId = String.fromCharCode(97 + index); // 97 is the ASCII value for 'a'

            // Insert bill item
            await db.run('INSERT INTO bill_items (bill_id, item_type, item_id, item_name, quantity, stone_weight, amount_per_gram,making_charges,item_description, total_amount,sub_item_id,wastage) VALUES (?,?, ?, ?, ?, ?,?,?, ?,?,?,?)', [
                billNumber,
                item.itemType,
                item.itemId,
                item.itemName,
                item.quantity,
                item.stoneWeight,
                item.amountPerGram,
                item.makingCharges,
                item.itemDescription,
                item.totalPrice,
                subItemId, // Add sub_item_id generated from index
                item.wastage

            ]);

            // Move item to sold stock
            if (item.itemType === 'silver') {
                await db.run('INSERT INTO sold_silver_stock_new (id, silver_type, quantity, customer_name, date_sold) VALUES (?, ?, ?, ?, ?)', [
                    item.itemId,
                    item.itemName,  // Assuming itemName is used as silver_type here
                    item.quantity,
                    customerName,
                    new Date().toISOString()
                ]);
                await db.run('DELETE FROM silver_stock WHERE id = ?', [item.itemId]);
            } 
            else if (item.itemType === 'gold') {
                await db.run('INSERT INTO sold_gold_stock (id, gold_type, quantity, customer_name, date_sold) VALUES (?, ?, ?, ?, ?)', [
                    item.itemId,
                    item.itemName,  // Assuming itemName is used as gold_type here
                    item.quantity,
                    customerName,
                    new Date().toISOString()
                ]);
                await db.run('DELETE FROM gold_stock WHERE id = ?', [item.itemId]);
            }
            else if (item.itemType === 'goldOrnaments') {
                await db.run('INSERT INTO sold_gold_stock_mass (id, gold_type, quantity, customer_name, date_sold,sub_item_id,bill_number) VALUES (?, ?, ?, ?, ?,?,?)', [
                    item.itemId,
                    item.itemName,  // Assuming itemName is used as gold_type here
                    item.quantity,
                    customerName,
                    new Date().toISOString(),
                    subItemId,
                    billNumber
                ]);
                // Deduct quantity from gold stock instead of deleting
                await db.run('UPDATE gold_stock_mass SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.itemId]);
            } 
            else if (item.itemType === 'silverOrnaments') {
                await db.run('INSERT INTO sold_silver_stock_mass (id, silver_type, quantity, customer_name, date_sold,sub_item_id,bill_number) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                    item.itemId,
                    item.itemName,  // Assuming itemName is used as silver_type here
                    item.quantity,
                    customerName,
                    new Date().toISOString(),
                    subItemId,
                    billNumber
                ]);
                // Deduct quantity from silver stock instead of deleting
                await db.run('UPDATE silver_stock_mass SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.itemId]);
            }
            index+=1;

        }

        // Commit transaction
        await db.run('COMMIT');

        res.json({ message: 'Bill generated successfully' });
    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error generating bill:', error);
        res.status(500).send('Error generating bill. <a href="/generate-bill">Try again</a>');
    }
});

// Promisified database query
app.get('/bills',isAuthenticated, async (req, res) => {

    try {
        const db = await initDB();
        const sql = 'SELECT * FROM bills where balance_amount>1';
        const rows = await db.all(sql);
        
        res.json({
            bills: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Promisified database query
app.get('/bills1',isAuthenticated, async (req, res) => {

    try {
        const db = await initDB();
        const sql = 'SELECT * FROM bills';
        const rows = await db.all(sql);
        
        res.json({
            bills: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to process the payment
app.post('/pay-bill/:bill_number',isAuthenticated, async (req, res) => {
    const billNumber = req.params.bill_number;
    const { amount_paid } = req.body;
    const db = await initDB();


    if (isNaN(amount_paid) || amount_paid <= 0) {
        return res.status(400).json({ error: 'Invalid amount provided' });
    }

    try {

        // Start a transaction
        await db.exec('BEGIN TRANSACTION');

        // Fetch the original bill
        const bill = await db.get('SELECT * FROM bills WHERE bill_number = ?', [billNumber]);
        if (!bill) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Calculate new amounts
        const newTotalPaid = bill.amount_paid + amount_paid;
        let remainingPayment = amount_paid;
        let newOldBalance = bill.old_balance;
        let newBalance = bill.balance_amount - amount_paid; // Reduce total balance first

        // Then handle old_balance reduction
        if (newOldBalance > 0) {
            if (remainingPayment >= newOldBalance) {
                newOldBalance = 0;
            } else {
                newOldBalance -= remainingPayment;
            }
        }

        // Update the original bill with new amounts
        await db.run(`
            UPDATE bills
            SET amount_paid = ?, balance_amount = ?, old_balance = ?
            WHERE bill_number = ?
        `, [newTotalPaid, newBalance, newOldBalance, billNumber]);

        // Find the last sub-bill number for the given bill_number
        const lastSubBill = await db.get(`
            SELECT sub_bill_number 
            FROM sub_bills 
            WHERE bill_number = ? 
            ORDER BY sub_bill_number  DESC
            LIMIT 1
        `, [billNumber]);

            let newSubBillNumber;
            if (!lastSubBill) {
                newSubBillNumber = 'a';
            } else if (lastSubBill.sub_bill_number === "First Payment") {
                newSubBillNumber = 'a';
            } else {
                const lastSubBillChar = lastSubBill.sub_bill_number;
                newSubBillNumber = String.fromCharCode(lastSubBillChar.charCodeAt(0) + 1);
            }

            
        const paymentDate = new Date().toISOString();

        await db.run(`
            INSERT INTO sub_bills (bill_number, sub_bill_number, amount_paid, payment_date)
            VALUES (?, ?, ?, ?)
        `, [billNumber, newSubBillNumber, amount_paid, paymentDate]);

        // Commit the transaction
        await db.exec('COMMIT');

        res.json({ message: 'Payment successful' });
    } catch (err) {
        // Rollback in case of error
        await db.exec('ROLLBACK');
        console.error('Error during payment:', err); // Enhanced error logging
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

//new
app.get('/payment-history/:bill_number',isAuthenticated, async (req, res) => {
    const billNumber = req.params.bill_number;

    try {
        const db = await initDB();
        
        // Fetch sub-bills for the given bill number
        const subBills = await db.all(`
            SELECT sub_bill_number, amount_paid, payment_date 
            FROM sub_bills 
            WHERE bill_number = ?
            ORDER BY payment_date ASC
        `, [billNumber]);

        res.json({ subBills });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.send('Please provide username, password, and role. <a href="/register">Try again</a>');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const db = await initDB();

    try {
        await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        res.send('User registered successfully! <a href="/login">Login</a>');
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            // Handle unique constraint violation
            res.send('Username already exists. <a href="register.html">Try again</a>');
        } else {
            // Handle other errors
            res.send('Error registering user. <a href="register.html">Try again</a>');
        }
    }
});

//extra
const dbPath = path.join(__dirname, '/database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Fetch bill details and associated items
app.get('/fetch-bill-details/:billNumber',isAuthenticated, (req, res) => {
    const billNumber = req.params.billNumber;

    db.get('SELECT * FROM bills WHERE bill_number = ?', [billNumber], (err, billRow) => {
        if (err) {
            console.error('Error fetching bill details:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (!billRow) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json({
            billNumber: billRow.bill_number,
            customerName: billRow.customer_name,
            customerPhone: billRow.customer_phone,
            billDate: billRow.bill_date,
            billId: billRow.bill_id,
            subtotal: billRow.subtotal,
            discount: billRow.discount,
            oldGold:billRow.oldGold,
            oldBalance:billRow.old_balance,
            amountPaid: billRow.amount_paid,
            balanceAmount: billRow.balance_amount
        });
    });
});

// Fetch bill items
app.get('/fetch-bill-items/:billId',isAuthenticated, (req, res) => {
    const billId = req.params.billId;

    db.all('SELECT * FROM bill_items WHERE bill_id = ?', [billId], (err, itemsRows) => {
        if (err) {
            console.error('Error fetching bill items:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.json(itemsRows.map(item => ({
            itemId: item.item_id,
            itemName: item.item_name,
            quantity: item.quantity,
            stoneWeight: item.stone_weight,
            wastage:item.wastage,
            amountPerGram: item.amount_per_gram,
            makingCharges:item.making_charges,
            totalAmount: item.total_amount
        })));

    });
});

//other bills balance updation
app.post('/submit-billing',isAuthenticated, (req, res) => {
    const { customerName, customerPhone, billDate, billNumber, totalAmountBalance, amountPaid, balanceAmount } = req.body;

    // Insert balance information into database
    const sql = `INSERT INTO billing_info (customer_name, customer_phone, bill_date, bill_number, total_amount, amount_paid, balance_amount) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [customerName, customerPhone, billDate, billNumber, totalAmountBalance, amountPaid, balanceAmount], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Balance transaction recorded successfully!' });
    });
});

// Route to handle deposit form submission
app.post('/submit-deposit',isAuthenticated, (req, res) => {
    const { customerName, customerPhone, depositDate, amountDeposited } = req.body;

    // Insert deposit information into database
    const sql = `INSERT INTO deposit_info (customer_name, customer_phone, deposit_date, amount_deposited) VALUES (?, ?, ?, ?)`;
    db.run(sql, [customerName, customerPhone, depositDate, amountDeposited], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Deposit transaction recorded successfully!' });
    });
});

app.get('/api/deposit_info',isAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM deposit_info'; // Fetch data from deposit_info table
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/api/billing_info',isAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM billing_info'; // Fetch data from billing_info table
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.patch('/api/update_deposit/:id',isAuthenticated, async (req, res) => {
    const depositId = req.params.id;
    const { amount, action } = req.body;
        const db = await initDB();


    // Query to get the current amount deposited for the specific deposit
    const currentDeposit = await db.get('SELECT amount_deposited FROM deposit_info WHERE id = ?', [depositId]);
    
    if (!currentDeposit) {
        return res.status(404).json({ message: "Deposit not found." });
    }

    let newAmount;
    if (action === 'deposit') {
        newAmount = currentDeposit.amount_deposited + amount;
    } else if (action === 'reduce') {
        if (currentDeposit.amount_deposited - amount < 0) {
            return res.status(400).json({ message: "Cannot reduce below zero." });
        }
        newAmount = currentDeposit.amount_deposited - amount;
    } else {
        return res.status(400).json({ message: "Invalid action." });
    }

    // Update the deposit info with the new amount
    await db.run('UPDATE deposit_info SET amount_deposited = ? WHERE id = ?', [newAmount, depositId]);

    res.status(200).json({ message: "Deposit amount updated successfully." });
});

app.post('/api/pay_balance',isAuthenticated, (req, res) => {
    const { bill_number, amount_paid, id } = req.body; // Include id in the request body

    // Fetch current billing info for the bill_number and id
    db.get('SELECT * FROM billing_info WHERE bill_number = ? AND id = ?', [bill_number, id], (err, billingRow) => {
        if (err || !billingRow) {
            return res.status(404).json({ error: 'Billing information not found.' });
        }

        // Calculate the new amount paid and balance amount
        const newAmountPaid = billingRow.amount_paid + amount_paid;
        const newBalanceAmount = billingRow.balance_amount - amount_paid;
        const paymentDate = new Date(); // Get the current date and time
        const localDate = new Date(paymentDate.getTime() - (paymentDate.getTimezoneOffset() * 60000)); // Adjust for timezone offset
        const formattedDate = localDate.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format


        // Update billing_info with the new amount paid and balance amount
        db.run(
            'UPDATE billing_info SET amount_paid = ?, balance_amount = ? WHERE bill_number = ? AND id = ?',
            [newAmountPaid, newBalanceAmount, bill_number, id], // Include id in the update
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Generate a new sub-bill identifier based on bill_number and id
                db.get('SELECT COUNT(*) as count FROM sub_bills_old WHERE bill_number = ? AND old_id = ?', [bill_number, id], (err, row) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    const subBillCount = row.count;
                    const subBillIdentifier = String.fromCharCode(97 + subBillCount); // 97 is the ASCII code for 'a'

                    // Insert into sub_bills_old table
                    db.run('INSERT INTO sub_bills_old (bill_number, sub_bill_id, amount_paid, payment_date,old_id) VALUES (?, ?, ?, ?,?)',
                        [bill_number, subBillIdentifier, amount_paid, new Date().toISOString(),id],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.json({ message: 'Balance paid successfully.', sub_bill_identifier: subBillIdentifier });
                        }
                    );
                });
            }
        );
    });
});

app.get('/api/payment_history/:bill_number',isAuthenticated, (req, res) => {
    const billNumber = req.params.bill_number;

    db.all('SELECT * FROM sub_bills_old WHERE bill_number = ?', [billNumber], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/next-bill-number',isAuthenticated, (req, res) => {
    const query = `SELECT MAX(bill_number) as maxBillNumber FROM bills`;

    db.get(query, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const nextBillNumber = row.maxBillNumber ? row.maxBillNumber + 1 : 1;
        res.json({ nextBillNumber });
    });
});

app.get('/api/gold-details', isAuthenticated,(req, res) => {
    const today = new Date();
    // Query for total weight and total items from gold_stock
    db.all(`SELECT SUM(quantity) AS total_weight, COUNT(*) AS total_items FROM gold_stock`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const { total_weight, total_items } = rows[0];
        // Query for sold gold details for today
        db.all(`SELECT date(sold.date_sold) AS date, 
                SUM(sold.quantity) AS items_sold, 
                SUM(items.total_amount) AS amount_collected 
                FROM sold_gold_stock AS sold 
                JOIN bill_items AS items 
                ON sold.id = items.item_id 
                WHERE items.item_type = 'gold' AND date(sold.date_sold) = date('${today.toISOString().split('T')[0]}') 
                GROUP BY date(sold.date_sold)`, [], (err, soldRows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                total_weight,
                total_items,
                sold_gold: soldRows
            });
        });
    });
});

// Endpoint to get silver details
app.get('/api/silver-details', isAuthenticated, (req, res) => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

    // Query for total weight and total items from silver_stock
    db.all(`SELECT SUM(quantity) AS total_weight, COUNT(*) AS total_items FROM silver_stock`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching silver stock details:', err.message); // Log error
            res.status(500).json({ error: err.message });
            return;
        }

        const { total_weight = 0, total_items = 0 } = rows[0]; // Default to 0 if null

        // Query for sold silver details for today
        db.all(`SELECT date(sold.date_sold) AS date, 
                       SUM(sold.quantity) AS items_sold, 
                       SUM(items.total_amount) AS amount_collected 
                FROM sold_silver_stock_new AS sold 
                JOIN bill_items AS items 
                ON sold.id = items.item_id 
                WHERE items.item_type = 'silver' 
                  AND date(sold.date_sold) = ? 
                GROUP BY date(sold.date_sold)`, [todayString], (err, soldRows) => {
            if (err) {
                console.error('Error fetching sold silver details:', err.message); // Log error
                res.status(500).json({ error: err.message });
                return;
            }
            // Send the response back to the client
            res.json({
                total_weight,
                total_items,
                sold_silver: soldRows
            });
        });
    });
});

app.get('/api/sale-details',isAuthenticated, (req, res) => {
    const today = new Date();

    // Query for total weight and total items from gold_stock
    db.all(`SELECT SUM(subtotal) AS total_amount,
        SUM(discount) as discount,
        SUM(amount_paid) as amount_paid,
        sum(balance_amount) as balance, 
        sum(oldGold) AS oldGold FROM bills`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const {total_amount,discount,amount_paid ,balance,oldGold} = rows[0];

        // Query for sold gold details for today
        db.all(`SELECT date(b.bill_date) AS date, 
            sum(b.subtotal) AS amount_collected, 
            sum(b.discount) AS discount,
            sum(b.amount_paid) AS amount_paid,
            sum(b.balance_amount) AS balance,
            sum(b.oldGold) as oldGold
        FROM bills AS b 
        WHERE date(b.bill_date) = date(?)`, [today.toISOString().split('T')[0]], (err, soldRows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
      
            res.json({
                total_amount,
                discount,
                amount_paid,
                balance,
                oldGold,
                sold_items: soldRows
            });
        });
    });
});

app.get('/api/order-details', isAuthenticated, async (req, res) => {
    const db = await initDB();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    try {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN oi.item_type = 'gold' THEN oi.quantity ELSE 0 END), 0) AS gold_total,
                COALESCE(COUNT(CASE WHEN oi.item_type = 'gold' THEN 1 END), 0) AS gold_count_total,
                COALESCE(SUM(CASE WHEN oi.item_type = 'silver' THEN oi.quantity ELSE 0 END), 0) AS silver_total,
                COALESCE(COUNT(CASE WHEN oi.item_type = 'silver' THEN 1 END), 0) AS silver_count_total,
                COALESCE(COUNT(DISTINCT o.id), 0) AS total_orders,
                COALESCE(SUM(CASE WHEN oi.item_type = 'gold' AND date(o.order_date) = ? THEN oi.quantity ELSE 0 END), 0) AS gold_orders_today,
                COALESCE(COUNT(CASE WHEN oi.item_type = 'gold' AND date(o.order_date) = ? THEN 1 END), 0) AS gold_orders_today_count,
                COALESCE(SUM(CASE WHEN oi.item_type = 'silver' AND date(o.order_date) = ? THEN oi.quantity ELSE 0 END), 0) AS silver_orders_today,
                COALESCE(COUNT(CASE WHEN oi.item_type = 'silver' AND date(o.order_date) = ? THEN 1 END), 0) AS silver_orders_today_count,
                COALESCE(SUM(CASE WHEN date(o.order_date) = ? THEN o.advance_payment ELSE 0 END), 0) AS amount_collected_today
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id 
            WHERE oi.delivery_status = 'pending';
        `;

        const result = await db.get(query, [todayStr, todayStr, todayStr, todayStr, todayStr]) || {};

        res.json({
            gold_total: result.gold_total,
            gold_count_total: result.gold_count_total,
            silver_total: result.silver_total,
            silver_count_total: result.silver_count_total,
            total_orders: result.total_orders,
            gold_orders_today: result.gold_orders_today,
            gold_orders_today_count: result.gold_orders_today_count,
            silver_orders_today: result.silver_orders_today,
            silver_orders_today_count: result.silver_orders_today_count,
            amount_collected_today: result.amount_collected_today,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/balance-details', isAuthenticated, (req, res) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Query for total balance and total count
    db.all(`
        SELECT 
            SUM(balance_amount) AS total_balance,
            COUNT(*) AS total_count
        FROM bills
        WHERE balance_amount > 0
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const balanceResult = rows[0] || {};

        // Query for today's payments and customer count
        db.all(`
            SELECT 
                SUM(amount_paid) AS amount_paid_today,
                COUNT(DISTINCT bill_number) AS customer_count_today
            FROM sub_bills
            WHERE date(payment_date) = date(?)
        `, [todayStr], (err, todayRows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const todayResult = todayRows[0] || {};

            res.json({
                total_balance: balanceResult.total_balance || 0,
                total_count: balanceResult.total_count || 0,
                amount_paid_today: todayResult.amount_paid_today || 0,
                customer_count_today: todayResult.customer_count_today || 0,
            });
        });
    });
});

app.get('/api/old-balance-deposite-details', isAuthenticated, (req, res) => {
    const today = new Date().toISOString().split('T')[0];  // Format: YYYY-MM-DD

    // SQL queries for fetching old balance and deposit details
    db.all(`
        SELECT 
            (SELECT SUM(amount_deposited) FROM deposit_info) AS total_deposit,
            (SELECT SUM(balance_amount) FROM billing_info WHERE balance_amount > 0) AS total_old_balance,
            (SELECT COUNT(id) FROM billing_info WHERE balance_amount > 0) AS total_count
            `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const { total_deposit, total_old_balance, total_count } = rows[0];

        // Query for fetching today's amount paid and deposit info
        db.all(`
            SELECT 
                SUM(s.amount_paid) AS amount_paid_today,
                SUM(d.amount_deposited) AS deposit_today
            FROM sub_bills_old AS s
            LEFT JOIN deposit_info AS d ON date(d.deposit_date) = date(?)
            WHERE date(s.payment_date) = date(?)`, [today, today], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const { amount_paid_today, deposit_today } = result[0];

            res.json({
                total_deposit: total_deposit || 0,
                total_old_balance: total_old_balance || 0,
                total_count: total_count || 0,
                amount_paid_today: amount_paid_today || 0,
                deposit_today: deposit_today || 0,
                current_date: today
            });
        });
    });
});

app.post('/submit-transaction', isAuthenticated,(req, res) => {
    const { name, numItems, items } = req.body;

    // Begin transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Insert into the transactions table
            const transactionStmt = db.prepare('INSERT INTO transactions (name, num_items) VALUES (?, ?)', (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
            });

            transactionStmt.run(name, numItems, function(err) {
                if (err) {
                    transactionStmt.finalize(); // Ensure to finalize on error
                    return res.status(500).json({ error: err.message });
                }

                const transactionId = this.lastID; // Get the last inserted ID

                // Prepare the statement for inserting items
                const itemStmt = db.prepare('INSERT INTO items (transaction_id, item_type, item_name, quantity, melting) VALUES (?, ?, ?, ?, ?)', (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                });

                // Insert each item into the items table
                items.forEach(item => {
                    itemStmt.run(transactionId, item.itemType, item.itemName, item.quantity, item.melting, (err) => {
                        if (err) {
                            itemStmt.finalize(); // Finalize on error
                            return res.status(500).json({ error: err.message });
                        }
                    });
                });

                itemStmt.finalize(); // Finalize after all items have been inserted

                // Commit the transaction
                db.run('COMMIT', (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ message: 'Transaction submitted successfully!' });
                });
            });

            transactionStmt.finalize(); // Finalize the transaction statement
        });
    });
});

app.post('/submit-amount-given-transaction', isAuthenticated, (req, res) => {
    const { name, date, amountGiven, description } = req.body;

    // Begin transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Prepare the statement for inserting amount given
            const stmt = db.prepare('INSERT INTO amount_given (name, date, amount_given, description) VALUES (?, ?, ?, ?)', (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
            });

            // Execute the insert statement
            stmt.run(name, date, amountGiven, description, function(err) {
                if (err) {
                    stmt.finalize(); // Finalize on error
                    return res.status(500).json({ error: err.message });
                }
                
                // Commit the transaction
                db.run('COMMIT', (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ message: 'Amount given transaction submitted successfully!' });
                });
            });

            stmt.finalize(); // Finalize the statement
        });
    });
});

app.get('/api/purchased-transactions',isAuthenticated, (req, res) => {
    db.all(`
        SELECT 
            id, 
            name, 
            num_items, 
            DATE(created_at) AS transaction_date 
        FROM transactions 
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Route to fetch amount given transactions
app.get('/api/amount-given-transactions',isAuthenticated, (req, res) => {
    db.all(`
        SELECT 
            id, 
            name, 
            DATE(date) AS payment_date, 
            amount_given, 
            description 
        FROM amount_given
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Route to get items for a specific transaction
app.get('/api/items/:transactionId', isAuthenticated, (req, res) => {
    const transactionId = req.params.transactionId;
    db.all(`
        SELECT 
            item_type, 
            item_name, 
            quantity, 
            melting 
        FROM items 
        WHERE transaction_id = ?
    `, [transactionId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/bill-items/:billNumber',isAuthenticated, (req, res) => {
    const billNumber = req.params.billNumber;

    // Fetch items from the database where bill_id matches the billNumber
    db.all(`
        SELECT  
            item_name, 
            quantity, 
            amount_per_gram,
            sub_item_id 
        FROM bill_items 
        WHERE bill_id = ?
    `, [billNumber], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        // Check if any items were found
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No items found for this bill' });
        }

        // Return the found items as JSON
        res.json({ items: rows });
    });
});

// Endpoint for fetching bill details
app.get('/bill-details/:billNumber',isAuthenticated, (req, res) => {
    const billNumber = req.params.billNumber;
    db.get('SELECT * FROM bills WHERE bill_number = ?', [billNumber], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(row);
    });
});

// Endpoint for fetching bill items
app.get('/billitems1/:billNumber',isAuthenticated, (req, res) => {
    const billNumber = req.params.billNumber;
    db.all('SELECT * FROM bill_items WHERE bill_id = ?', [billNumber], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }
        // Log the fetched rows to debug

        res.json(rows); // Return the fetched rows
    });
});

// Endpoint for returning an item
app.post('/return-item', isAuthenticated, (req, res) => {
    const { billNumber, itemId, itemType, itemName, quantity, totalAmount,subItemId, updatedAmount,newOGamount } = req.body;

    // Step 1: Delete the item from the `bill_items` table
    db.run(`DELETE FROM bill_items WHERE bill_id = ? AND item_id = ? AND item_type=?`, [billNumber, itemId, itemType], function (err) {
        if (err) {
            console.error('Error deleting item from bill_items:', err);
            return res.status(500).json({ error: 'Failed to delete item from bill_items' });
        }

        // Step 2: Fetch the existing bill details
        db.all(`SELECT * FROM bills WHERE bill_number = ?`, [billNumber], (err, rows) => {
            if (err) {
                console.error('Error fetching bill details:', err);
                return res.status(500).json({ error: 'Failed to fetch bill details' });
            }

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Bill not found' });
            }

            const bill = rows[0];
            const newSubtotal = bill.subtotal - totalAmount; // Subtract the amount to deduct
            const newOG=newOGamount;
            const newAmountPaid = updatedAmount; // Update amount paid
            const newBalanceAmount = newSubtotal - newOG - bill.discount - newAmountPaid; // Calculate new balance

            // Step 3: Update the `bills` table
            db.run(`UPDATE bills SET subtotal = ?, amount_paid = ?, balance_amount = ? , oldGold=?  WHERE bill_number = ?`, 
            [newSubtotal, newAmountPaid, newBalanceAmount,newOG, billNumber], function (err) {
                if (err) {
                    console.error('Error updating bills table:', err);
                    return res.status(500).json({ error: 'Failed to update bills' });
                }

                // Step 4: Add the item back to the respective stock
                if (itemType === 'gold') {
                    db.run(`INSERT INTO gold_stock (id, gold_type, date_added, quantity) VALUES (?, ?, ?, ?)`,
                        [itemId, itemName, new Date().toISOString(), quantity], function (err) {
                            if (err) {
                                console.error('Error adding item to gold_stock:', err);
                                return res.status(500).json({ error: 'Failed to add item to gold_stock' });
                            }

                            // Step 5: Remove from sold_gold_stock
                            db.run(`DELETE FROM sold_gold_stock WHERE id = ?`, [itemId], function (err) {
                                if (err) {
                                    console.error('Error deleting from sold_gold_stock:', err);
                                    return res.status(500).json({ error: 'Failed to delete from sold_gold_stock' });
                                }
                                checkRemainingItemsAndResetBill(billNumber, res);
                            });
                        });
                } else if (itemType === 'silver') {
                    db.run(`INSERT INTO silver_stock (id, silver_type, date_added, quantity) VALUES (?, ?, ?, ?)`,
                        [itemId, itemName, new Date().toISOString(), quantity], function (err) {
                            if (err) {
                                console.error('Error adding item to silver_stock:', err);
                                return res.status(500).json({ error: 'Failed to add item to silver_stock' });
                            }

                            // Step 5: Remove from sold_silver_stock
                            db.run(`DELETE FROM sold_silver_stock_new WHERE id = ?`, [itemId], function (err) {
                                if (err) {
                                    console.error('Error deleting from sold_silver_stock:', err);
                                    return res.status(500).json({ error: 'Failed to delete from sold_silver_stock' });
                                }
                                checkRemainingItemsAndResetBill(billNumber, res);
                            });
                        });
                } else if (itemType === 'goldOrnaments') {
                    db.run(`UPDATE gold_stock_mass SET quantity = quantity + ? WHERE id = ?`,
                        [quantity, itemId], function (err) {
                            if (err) {
                                console.error('Error adding item to gold_stock_mass:', err);
                                return res.status(500).json({ error: 'Failed to add item to gold_stock_mass' });
                            }

                            db.run(`
                                DELETE FROM sold_gold_stock_mass
                                WHERE bill_number = ?
                                AND sub_item_id = ?`,[ billNumber,subItemId],  
                                function (err) {
                                    if (err) {
                                        console.error('Error deleting from sold_gold_stock_mass:', err);
                                        return res.status(500).json({ error: 'Failed to delete from sold_silver_stock_mass' });
                                    }
                                    checkRemainingItemsAndResetBill(billNumber, res);
                                });
                        });
                } else if (itemType === 'silverOrnaments') {
                    db.run(`UPDATE silver_stock_mass SET quantity = quantity + ? WHERE id = ?`,
                        [quantity, itemId], function (err) {
                            if (err) {
                                console.error('Error adding item to silver_stock_mass:', err);
                                return res.status(500).json({ error: 'Failed to add item to silver_stock_mass' });
                            }
                            db.run(`
                                DELETE FROM sold_silver_stock_mass
                                where bill_number = ?
                                AND sub_item_id = ?`, 
                                [billNumber,subItemId],  // using customerName instead of itemId
                                function (err) {
                                    if (err) {
                                        console.error('Error deleting from sold_silver_stock_mass:', err);
                                        return res.status(500).json({ error: 'Failed to delete from sold_silver_stock_mass' });
                                    }
                                    checkRemainingItemsAndResetBill(billNumber, res);
                                }
                            );                        
                    });
                }
            });
        });
    });
});

// Helper function to check remaining items in bill_items and reset bill if empty
function checkRemainingItemsAndResetBill(billNumber, res) {
    db.all(`SELECT COUNT(*) AS count FROM bill_items WHERE bill_id = ?`, [billNumber], (err, rows) => {
        if (err) {
            console.error('Error checking remaining items:', err);
            return res.status(500).json({ error: 'Failed to check remaining items' });
        }

        const itemCount = rows[0].count;

        // If no items are left, reset the bill to 0 values
        if (itemCount === 0) {
            db.run(`UPDATE bills SET subtotal = 0, discount = 0, amount_paid = 0, balance_amount = 0, oldGold=0 WHERE bill_number = ?`, [billNumber], function (err) {
                if (err) {
                    console.error('Error resetting bill:', err);
                    return res.status(500).json({ error: 'Failed to reset bill' });
                }
                res.json({ message: 'Item returned and bill reset', success: true });
            });
        } else {
            res.json({ message: 'Item returned and bill updated', success: true });
        }
    });
}

app.put('/update-weight/:id',isAuthenticated, (req, res) => {
    const stockId = req.params.id;
    const newWeight = req.body.newWeight;

    // Update the quantity in the gold_stock table
    db.run('UPDATE gold_stock SET quantity = ? WHERE id = ?', [newWeight, stockId], function (err) {
        if (err) {
            console.error('Error updating weight:', err);
            return res.status(500).json({ message: 'Failed to update weight' });
        }
        res.json({ message: 'Weight updated successfully' });
    });
});
app.put('/update-weight-mass/:id',isAuthenticated, (req, res) => {
    const stockId = req.params.id;
    const newWeight = req.body.newWeight;

    // Update the quantity in the gold_stock table
    db.run('UPDATE gold_stock_mass SET quantity = ? WHERE id = ?', [newWeight, stockId], function (err) {
        if (err) {
            console.error('Error updating weight:', err);
            return res.status(500).json({ message: 'Failed to update weight' });
        }
        res.json({ message: 'Weight updated successfully' });
    });
});
app.put('/update-weight1/:id', isAuthenticated,(req, res) => {
    const stockId = req.params.id;
    const newWeight = req.body.newWeight;

    // Update the quantity in the gold_stock table
    db.run('UPDATE silver_stock SET quantity = ? WHERE id = ?', [newWeight, stockId], function (err) {
        if (err) {
            console.error('Error updating weight:', err);
            return res.status(500).json({ message: 'Failed to update weight' });
        }
        res.json({ message: 'Weight updated successfully' });
    });
});
app.put('/update-weight1-mass/:id',isAuthenticated, (req, res) => {
    const stockId = req.params.id;
    const newWeight = req.body.newWeight;

    // Update the quantity in the gold_stock table
    db.run('UPDATE silver_stock_mass SET quantity = ? WHERE id = ?', [newWeight, stockId], function (err) {
        if (err) {
            console.error('Error updating weight:', err);
            return res.status(500).json({ message: 'Failed to update weight' });
        }
        res.json({ message: 'Weight updated successfully' });
    });
});


app.post('/add-stock-mass', isAuthenticated, async (req, res) => {
    const { goldType, quantity } = req.body;

    if (!goldType || quantity === undefined) {
        return res.send('Please provide gold type and quantity. <a href="/add-stock-gold">Try again</a>');
    }

    const db = await initDB();

    try {
        // Convert quantity to a number
        const quantityNumber = Number(quantity); // or use +quantity

        // Check if the gold_type already exists
        const existingGold = await db.get('SELECT * FROM gold_stock_mass WHERE gold_type = ?', [goldType]);

        if (existingGold) {
            // If it exists, update the quantity
            const newQuantity = existingGold.quantity + quantityNumber; // Add the new quantity
            await db.run('UPDATE gold_stock_mass SET quantity = ?, date_added = ? WHERE gold_type = ?', [newQuantity, new Date().toISOString(), goldType]);
        } else {
            // If it does not exist, insert a new record
            await db.run('INSERT INTO gold_stock_mass (gold_type, quantity, date_added) VALUES (?, ?, ?)', [goldType, quantityNumber, new Date().toISOString()]);
        }

        res.redirect('/add-stock-gold?success=true'); // Redirect with success=true
    } catch (error) {
        console.error('Error adding stock:', error); // Log the error for debugging
        res.send('Error adding stock. <a href="/add-stock-gold">Try again</a>');
    }
});

app.post('/add-stock-silver-mass', isAuthenticated, async (req, res) => {
    const { silverType, quantity } = req.body;

    if (!silverType || quantity === undefined) {
        return res.send('Please provide silver type and quantity. <a href="/add-stock-silver">Try again</a>');
    }

    const db = await initDB();

    try {
        // Check if the silverType already exists
        const quantityNumber = Number(quantity); // or use +quantity

        const existingSilver = await db.get('SELECT quantity FROM silver_stock_mass WHERE silver_type = ?', [silverType]);

        if (existingSilver) {
            // If it exists, update the quantity
            const newQuantity = existingSilver.quantity + quantityNumber;
            await db.run('UPDATE silver_stock_mass SET quantity = ?, date_added = ? WHERE silver_type = ?', [newQuantity, new Date().toISOString(), silverType]);
        } else {
            // If it doesn't exist, insert a new record
            await db.run('INSERT INTO silver_stock_mass (silver_type, quantity, date_added) VALUES (?, ?, ?)', [silverType, quantity, new Date().toISOString()]);
        }

        res.redirect('/add-stock-silver?success=true'); // Redirect with success=true
    } catch (error) {
        console.error('Error adding silver stock:', error); // Log the error for debugging
        res.send('Error adding silver stock. <a href="/add-stock-silver">Try again</a>');
    }
});
app.get('/fetch-sub-bills/:billNumber', isAuthenticated, (req, res) => {
    const billNumber = req.params.billNumber;

    db.all(
        'SELECT sub_bill_number, amount_paid, payment_date FROM sub_bills WHERE bill_number = ? ORDER BY sub_bill_number ASC',
        [billNumber],
        (err, subBillsRows) => {
            if (err) {
                console.error('Error fetching sub-bills:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (subBillsRows.length === 0) {
                return res.status(404).json({ error: 'No sub-bills found for the given bill number' });
            }

            // Format and send the response
            const subBills = subBillsRows.map(row => ({
                details: row.sub_bill_number,
                amountPaid: row.amount_paid,
                paymentDate: row.payment_date,
            }));

            res.json(subBills);
        }
    );
});

app.get('/fetch-order/:orderId', isAuthenticated, async (req, res) => {
    const db = await initDB();
    const orderId = req.params.orderId;
    
    try {
        // Get order details
        const order = await db.get(`
            SELECT 
            o.id,
            o.customer_name,
                o.customer_phone,
                o.order_date,
                o.subtotal,
                o.advance_payment,
                o.balance_amount
                FROM orders o
                WHERE o.id = ?
                `, [orderId]);
                
                if (!order) {
                    return res.status(404).json({ error: 'Order not found' });
                }
                
                // Get order items
                const items = await db.all(`
                    SELECT *
                    FROM order_items
                    WHERE order_id = ?
                    `, [orderId]);

        order.items = items;
        
        res.json(order);

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/fetch-orders', isAuthenticated, async (req, res) => {
    const db = await initDB();
    
    try {
        // Get all orders with their details
        const orders = await db.all(`
            SELECT 
            id,
            customer_name,
            customer_phone, 
            order_date,
            subtotal,
            advance_payment,
            balance_amount
            FROM orders
            ORDER BY order_date DESC
            `);
            
            res.json(orders);
            
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    });
    
    
    
app.post('/update-delivery-status/:orderId/:itemId', isAuthenticated, async (req, res) => {
    const db = await initDB();
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    
    try {
        await db.run(`
            UPDATE order_items 
            SET delivery_status = ? 
            WHERE order_id = ? AND id = ?
            `, [status, orderId, itemId]);
            
            res.json({ success: true });
            
        } catch (error) {
            console.error('Error updating delivery status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

});

app.get('/get-next-order-number', isAuthenticated, async (req, res) => {
    const db = await initDB();
    try {
        const result = await db.get('SELECT MAX(id) as maxId FROM orders');
        const nextOrderNumber = (result.maxId || 0) + 1;
        res.json({ nextOrderNumber });
    } catch (error) {
        console.error('Error getting next order number:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/delete-bill/:billNumber', isAuthenticated, async (req, res) => {
    const db = await initDB();
    const { billNumber } = req.params;

    try {
        // Begin transaction
        await db.run('BEGIN TRANSACTION');

        // First get all items from bill_items for this bill
        const billItems = await db.all('SELECT * FROM bill_items WHERE bill_id = ?', [billNumber]);

        // Get all sub bill numbers for this bill
        const subBills = await db.all('SELECT sub_bill_number FROM sub_bills WHERE bill_number = ?', [billNumber]);
        const subBillNumbers = subBills.map(sb => sb.sub_bill_number);

        // Return quantities back to respective inventory tables and delete from sold stock
        for (const item of billItems) {
            if (item.item_type === 'gold') {
                // Delete from sold_gold_stock where sub_bill_number matches
                await db.run(`
                    DELETE FROM sold_gold_stock 
                    WHERE id = ?`,
                    [item.item_id]
                );
                // Insert into gold_stock with today's date
                await db.run(`
                    INSERT INTO gold_stock (id, gold_type, quantity, date_added)
                    VALUES (?, ?, ?, ?)`,
                    [item.item_id, item.item_name, item.quantity, new Date().toISOString()]
                );
            } 
            else if (item.item_type === 'silver') {
                // Delete from silver_sold_stock where sub_bill_number matches
                await db.run(`
                    DELETE FROM sold_silver_stock_new 
                    WHERE id = ?`,
                    [item.item_id]
                );
                // Insert into silver_stock with today's date
                await db.run(`
                    INSERT INTO silver_stock (id, silver_type, quantity, date_added)
                    VALUES (?, ?, ?, ?)`,
                    [item.item_id, item.item_name, item.quantity, new Date().toISOString()]
                );
            }
            else if (item.item_type === 'goldOrnaments') {
                await db.run(`
                    UPDATE gold_stock_mass 
                    SET quantity = quantity + ? 
                    WHERE id = ?`,
                    [item.quantity, item.item_id]
                );
                // Delete from sold_gold_stock_mass where sub_bill_number matches
                await db.run(`
                    DELETE FROM sold_gold_stock_mass 
                    WHERE bill_number = ?`,
                    [billNumber]
                );
            }
            else if (item.item_type === 'silverOrnaments') {
                await db.run(`
                    UPDATE silver_stock_mass 
                    SET quantity = quantity + ? 
                    WHERE id = ?`,
                    [item.quantity, item.item_id]
                );
                // Delete from silver_sold_stock_mass where sub_bill_number and sub_item_id match
                await db.run(`
                    DELETE FROM sold_silver_stock_mass 
                    WHERE bill_number = ?`,
                    [billNumber]
                );
            }
        }

        // Delete related records from sub_bills table
        await db.run('DELETE FROM sub_bills WHERE bill_number = ?', [billNumber]);

        // Delete related records from bill_items table 
        await db.run('DELETE FROM bill_items WHERE bill_id = ?', [billNumber]);

        // Delete the bill from bills table
        await db.run('DELETE FROM bills WHERE bill_number = ?', [billNumber]);

        // Commit transaction
        await db.run('COMMIT');

        res.json({ success: true });

    } catch (error) {
        // Rollback transaction on error
        await db.run('ROLLBACK');
        console.error('Error deleting bill:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Endpoint to modify bill fields
app.post('/modify-bill', isAuthenticated, async (req, res) => {
    const { billNumber, field, value } = req.body;
    const db = await initDB();

    try {
        // Start transaction
        await db.exec('BEGIN TRANSACTION');

        // Map frontend field names to database column names
        const fieldMappings = {
            'amount_paid': 'amount_paid',
            'balance_amount': 'balance_amount', 
            'old_balance': 'old_balance',
            'discount': 'discount',
            'subtotal': 'subtotal',
            'oldGold': 'oldGold'
        };

        const dbField = fieldMappings[field];
        if (!dbField) {
            throw new Error('Invalid field name');
        }

        if (field === 'old_balance') {
            // Get current old_balance value
            const currentBill = await db.get('SELECT old_balance, balance_amount FROM bills WHERE bill_number = ?', [billNumber]);
            const difference = value - currentBill.old_balance;

            if (difference > 0) {
                // If new old_balance is higher, add the difference to balance_amount
                await db.run(
                    `UPDATE bills 
                     SET old_balance = ?,
                         balance_amount = balance_amount + ?
                     WHERE bill_number = ?`,
                    [value, difference, billNumber]
                );
            } else {
                // If new old_balance is lower, subtract from both
                await db.run(
                    `UPDATE bills 
                     SET old_balance = ?,
                         balance_amount = balance_amount + ?
                     WHERE bill_number = ?`,
                    [value, difference, billNumber]
                );
            }
        } else {
            // Update other fields normally
            const sql = `UPDATE bills SET ${dbField} = ? WHERE bill_number = ?`;
            await db.run(sql, [value, billNumber]);
        }

        // Commit transaction
        await db.run('COMMIT');

        res.json({ success: true });

    } catch (error) {
        // Rollback on error
        await db.run('ROLLBACK');
        console.error('Error modifying bill:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/generate-order', isAuthenticated, async (req, res) => {
    const db = await initDB(); // Get database connection
    // const imageDb = await initOrderImageDB(); // Get image database connection
    try {
        const orderData = req.body;
        
        // Validate required fields
        if (!orderData.customerName || !orderData.customerPhone || !orderData.items || orderData.items.length === 0) {
            throw new Error('Missing required order fields');
        }
        
        // Insert into orders table
        const result = await db.run(
            'INSERT INTO orders (customer_name, customer_phone, order_date, subtotal, advance_payment, balance_amount) VALUES (?, ?, ?, ?, ?, ?)',
            [
                orderData.customerName,
                orderData.customerPhone,
                new Date().toISOString(),
                orderData.totalAmount,
                orderData.advancePayment || 0, // Default to 0 if not provided
                orderData.balanceAmount
            ]
        );

        const orderId = result.lastID;
        
        // Insert order items
        const stmt = await db.prepare(
            'INSERT INTO order_items (order_id, sub_id,item_type, item_name, quantity, amount_per_gram, making_charges, wastage, item_description, total_amount) VALUES (? ,?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        const subid='a';
        const result1 = await db.run(
            'INSERT INTO advance_payment (order_id, sub_id, date, amount) VALUES (?, ?, ?, ?)',
            [
                orderId,
                subid,
                new Date().toISOString(),
                orderData.advancePayment || 0, // Default to 0 if not provided
            ]
        );
        
        for (const item of orderData.items) {
            // Validate required item fields
            if (!item.itemType || !item.itemName || !item.quantity || 
                !item.amountPerGram || item.totalAmount === undefined) {
                throw new Error('Missing required item fields');
            }
            
            await stmt.run(
                orderId,
                item.subItemId,
                item.itemType,
                item.itemName,
                item.quantity,
                item.amountPerGram,
                item.makingCharges || 0,
                item.wastage || 0,
                item.itemDescription || '',
                item.totalAmount
            );
        }
        
        await stmt.finalize();

        res.json({ success: true, message: 'Order created successfully', orderId });
        
    } catch (error) {
        console.error('Error generating order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});



app.post('/upload-item-image', upload.single('image'), async (req, res) => {
    try {
        const { subItemId, orderId } = req.body;
        const image = req.file ? req.file.buffer : null;

        if (!orderId || !subItemId || !image) {
            return res.status(400).json({ error: 'Missing order ID, sub-item ID, or image' });
        }

        const db = await initOrderImageDB(); // Get database connection

        // Insert the image into the database
        await db.run(
            'INSERT INTO order_images (order_id, sub_id, image) VALUES (?, ?, ?)',
            [orderId, subItemId, image]
        );

        res.json({ message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Retrieve images for a specific order_id and sub_item_id
app.get("/order-images/:orderId/:subItemId", async (req, res) => {
    const { orderId, subItemId } = req.params;

    try {
        const db = await initOrderImageDB();
        const rows = await db.all(
            "SELECT image FROM order_images WHERE order_id = ? AND sub_id = ?",
            [orderId, subItemId]
        );

        if (rows.length > 0) {
            const images = rows.map(row => row.image.toString("base64"));
            res.json({ success: true, images });
        } else {
            res.status(404).json({ success: false, message: "No images found" });
        }
    } catch (err) {
        console.error("Error fetching order images:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});




app.post('/make-advance-payment', isAuthenticated, async (req, res) => {
    const db = await initDB();
    try {
        const { orderId, amount } = req.body;

        if (!orderId || !amount || amount <= 0) {
            throw new Error('Invalid input data');
        }

        // Get current balance and advance
        const order = await db.get('SELECT advance_payment, balance_amount FROM orders WHERE id = ?', [orderId]);

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        if (amount > order.balance_amount) {
            return res.status(400).json({ success: false, error: 'Amount exceeds balance' });
        }

        // Generate sub_id for this payment (get next letter based on existing payments)
        const existingPayments = await db.all('SELECT sub_id FROM advance_payment WHERE order_id = ?', [orderId]);
        const nextCharCode = 'a'.charCodeAt(0) + existingPayments.length;
        const paymentSubId = String.fromCharCode(nextCharCode);

        // Insert into advance_payment
        await db.run(
            'INSERT INTO advance_payment (order_id, sub_id, date, amount) VALUES (?, ?, ?, ?)',
            [orderId, paymentSubId, new Date().toISOString(), amount]
        );

        // Update orders table
        const newAdvance = order.advance_payment + amount;
        const newBalance = order.balance_amount - amount;

        await db.run(
            'UPDATE orders SET advance_payment = ?, balance_amount = ? WHERE id = ?',
            [newAdvance, newBalance, orderId]
        );

        res.json({ success: true });

    } catch (err) {
        console.error('Advance payment error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/get-advance-history/:orderId', (req, res) => {
    const { orderId } = req.params;

    const query = `SELECT sub_id, amount, date FROM advance_payment WHERE order_id = ? ORDER BY date ASC`;

    db.all(query, [orderId], (err, rows) => {
        if (err) {
            console.error('Error fetching payment history:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.json(rows);
    });
});

const PASSWORD = "1"; // change this

// Password verification endpoint
app.post("/verify-password", (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
});