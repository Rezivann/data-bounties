const sqlite3 = require('better-sqlite3');

const db = new sqlite3("databounties.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS bounties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        payout_amount REAL NOT NULL,
        total_slots INTEGER NOT NULL,
        slots_filled INTEGER DEFAULT 0, 
        escrow_account_id TEXT,
        status TEXT DEFAULT 'open'

    CREATE TABLE IF NOT EXISTS submissions(
        image SOME TYPE
        user
        image_hash TEXT NOT NULL
        perceptual_hash TEXT NOT NULL
        caption TEXT NOT NULL
        confidence_score REAL NOT NULL,
        

    )
`);