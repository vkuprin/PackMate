import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";
import {User} from "./user";

export const verify = (req: any, res: Response, next: NextFunction) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json('Access Denied');

    try {
        req.user = jwt.verify(token, process.env.TOKEN_SECRET || "token") as User;
        next();
    } catch (error) {
        res.status(400).json('Invalid Token');
    }
};
