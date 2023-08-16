import { Request, Response } from 'express';
import {db} from './db';
import { exec } from 'child_process';

export const getPackages = (req: Request, res: Response) => {
    db.all("SELECT * FROM packages", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json('Error retrieving packages');
        } else {
            res.json(rows);
        }
    });
};

export const getPackageByName = (req: Request, res: Response) => {
    const name = req.params.name;

    db.get("SELECT * FROM packages WHERE name = ?", [name], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).json('Error retrieving package');
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json('Package not found');
        }
    });
};

export const searchPackages = (req: Request, res: Response) => {
    const searchTerm = req.query.q;

    db.all("SELECT * FROM packages WHERE name LIKE ?", ['%' + searchTerm + '%'], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json('Error retrieving packages');
        } else {
            res.json(rows);
        }
    });
};

export const uploadPackage = (req: any, res: Response) => {
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
};
