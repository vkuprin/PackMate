import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { openDb } from './src/db';
import * as authController from './src/authController';
import * as packageController from './src/packageController';
import { verify } from './src/middleware';

export const app = express();
const upload = multer({ dest: "uploads/" });

openDb();

app.use(cors());
app.use(express.json());
app.use('/packages', verify);
app.use('/upload', verify);

app.post('/login', authController.login);

app.get('/packages', packageController.getPackages);
app.get('/packages/:name', packageController.getPackageByName);
app.get('/packages/search', packageController.searchPackages);
app.post("/upload", [verify, upload.single("package")], packageController.uploadPackage);

app.use("/packages", (req, res, next) => {
    console.log(`File requested: ${req.originalUrl}, Full path: ${path.join(__dirname, 'packages', req.originalUrl)}`);
    next();
}, express.static("packages"));

app.listen(4269, () => {
    console.log("Server started on port 4269");
});
