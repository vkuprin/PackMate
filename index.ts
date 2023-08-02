import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { exec } from "child_process";
import { Database } from 'sqlite3';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
const upload = multer({ dest: "uploads/" });

let db = new Database('./db.sqlite3', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the sqlite database.');
    db.run('CREATE TABLE IF NOT EXISTS users(username TEXT UNIQUE, password TEXT)', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
});

app.use(cors());
app.use(express.json());

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            return console.error(err.message);
        }

        if (row) {
            const validPassword = await bcrypt.compare(password, row.password);
            if (!validPassword) return res.status(400).json("Wrong password or username");

            const token = jwt.sign({ username: row.username }, process.env.TOKEN_SECRET || "token");
            res.header('auth-token', token).json(token);

        } else {
            res.status(400).json("Wrong password or username");
        }
    });
});

const verify = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET || "token");
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json('Invalid Token');
    }
};

app.use("/packages", express.static("packages"));

app.post("/upload", [verify, upload.single("package")], (req, res) => {
    exec(`mv ${req.file.path} packages/${req.file.originalname} && rm -r uploads/*`, (error) => {
        if (error) {
            console.error(`Error moving file: ${error}`);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});
