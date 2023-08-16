import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

export let db: sqlite3.Database;

export function openDb() {
    db = new sqlite3.Database('../db.sqlite3', (err) => {
        if (err) {
            console.error(`Could not open database: ${err.message}`);
            process.exit(1);
        }
    });

    db.run('CREATE TABLE IF NOT EXISTS users(username TEXT UNIQUE, password TEXT, role TEXT DEFAULT "reader")', createAdminUser);
    db.run('CREATE TABLE IF NOT EXISTS packages(name TEXT UNIQUE, description TEXT, latest_version TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS package_versions(package_id INTEGER, version TEXT, filepath TEXT, dependencies TEXT, FOREIGN KEY (package_id) REFERENCES packages(rowid))');
}

async function createAdminUser() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    db.run("INSERT OR IGNORE INTO users(username, password, role) VALUES(?, ?, ?)", ['testuser', hashedPassword, 'admin'], (err) => {
        if (err) {
            console.error(`Could not insert admin user: ${err.message}`);
        } else {
            console.log('Admin user created or already exists');
        }
    });
}
