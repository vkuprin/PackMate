import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { exec } from "child_process";
import sqlite3 from 'sqlite3';
import cors from 'cors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import path from 'path';

interface User {
    username: string;
    password: string;
    role: 'admin' | 'publisher' | 'reader';
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: User | JwtPayload;
    }
}

export const app = express();
const upload = multer({ dest: "uploads/" });

let db: sqlite3.Database;

function openDb() {
    db = new sqlite3.Database('./db.sqlite3', (err) => {
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

const verify = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json('Access Denied');

    try {
        req.user = jwt.verify(token, process.env.TOKEN_SECRET || "token") as User;
        next();
    } catch (error) {
        res.status(400).json('Invalid Token');
    }
};

openDb();

app.use(cors());
app.use(express.json());
app.use('/packages', verify);
app.use('/upload', verify);

app.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body as User;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row: User) => {
        if (err) {
            return console.error(err.message);
        }

        if (row) {
            const validPassword = await bcrypt.compare(password, row.password);
            if (!validPassword) return res.status(400).json("Wrong password or username");

            const token = jwt.sign({ username: row.username, role: row.role }, process.env.TOKEN_SECRET || "token");
            res.header('auth-token', token).json(token);
        } else {
            res.status(400).json("Wrong password or username");
        }
    });
});

app.get('/packages', (req: Request, res: Response) => {
    db.all("SELECT * FROM packages", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json('Error retrieving packages');
        } else {
            res.json(rows);
        }
    });
});

app.use("/packages", (req, res, next) => {
    console.log(`File requested: ${req.originalUrl}, Full path: ${path.join(__dirname, 'packages', req.originalUrl)}`);
    next();
}, express.static("packages"));


app.get('/packages/:name', (req: Request, res: Response) => {
    const name = req.params.name;

    db.get("SELECT * FROM packages WHERE name = ?", [name], (err, row) => {
        console.log('THIS IS', row);
        if (err) {
            console.error(err.message);
            res.status(500).json('Error retrieving package');
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json('Package not found');
        }
    });
});

app.get('/packages/search', (req: Request, res: Response) => {
    const searchTerm = req.query.q;


    db.all("SELECT * FROM packages WHERE name LIKE ?", ['%' + searchTerm + '%'], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json('Error retrieving packages');
        } else {
            res.json(rows);
        }
    });
});

// app.use("/packages", express.static("packages"));

app.post("/upload", [verify, upload.single("package")], (req: Request, res: Response) => {
    if (req.user && 'role' in req.user && req.user.role !== 'reader') {
        if (req.file && "originalname" in req.file) {
            const packageName = req.file.originalname;
            const description = 'Some description';
            const latest_version = '1.0.0';

            exec(`mv "${req.file.path}" "packages/${packageName}"`, (error) => {
                if (error) {
                    console.error(`Error moving file: ${error}`);
                    res.sendStatus(500);
                } else {
                    db.run("INSERT INTO packages(name, description, latest_version) VALUES (?, ?, ?)", [packageName, description, latest_version], (err) => {
                        if (err) {
                            console.error(`Error inserting package: ${err.message}`);
                            res.status(500).json('Error inserting package');
                        } else {
                            res.sendStatus(200);
                        }
                    });
                }
            });
        }
    } else {
        res.status(403).json('Permission Denied');
    }
});

app.listen(4269, () => {
    console.log("Server started on port 4269");
});
