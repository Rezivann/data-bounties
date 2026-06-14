const db = require('./database');

db.prepare('DELETE FROM users').run();
db.prepare('DELETE FROM submissions').run();
db.prepare('DELETE FROM used_tokens').run();
db.prepare("UPDATE bounties SET slots_filled = 0, status = 'open'").run();

console.log('reset complete');