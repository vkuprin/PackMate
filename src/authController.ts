import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './user';
import {db} from "./db";

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body as User;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err: any, row: User) => {
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
};
