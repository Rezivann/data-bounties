const sqlite3 = require('better-sqlite3');
const dbPath = process.env.DB_PATH || path.join(__dirname, "databounties.db");
const db = new sqlite3("databounties.db")(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS bounties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        category TEXT NOT NULL,
        payout_amount REAL NOT NULL,
        total_slots INTEGER NOT NULL,
        slots_filled INTEGER DEFAULT 0, 
        escrow_account_id TEXT,
        status TEXT DEFAULT 'open'
    );

    CREATE TABLE IF NOT EXISTS submissions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bounty_id INTEGER NOT NULL,
        wallet_address TEXT NOT NULL,
        token_id TEXT,
        serial_number TEXT,
        image_hash TEXT, 
        perceptual_hash TEXT,
        caption TEXT,
        confidence_score REAL,
        metadata_pointer TEXT,
        timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS used_tokens(
        token_id TEXT NOT NULL,
        bounty_id INTEGER NOT NULL,
        PRIMARY KEY (token_id, bounty_id)
    );


    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT UNIQUE NOT NULL,
        hedera_account_id TEXT,
        created_at INTEGER
    );
`);

module.exports = db;