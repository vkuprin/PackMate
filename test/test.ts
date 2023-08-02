import request from 'supertest';
import { app } from '../index';
import sqlite3 from 'sqlite3';
import { Server } from 'http';

jest.mock('sqlite3', () => {
    const sqlite3 = jest.requireActual('sqlite3');
    sqlite3.Database.prototype.run = jest.fn();
    sqlite3.Database.prototype.get = jest.fn();
    return sqlite3;
});

const mockDb = sqlite3.Database as jest.MockedClass<typeof sqlite3.Database>;

describe('POST /login', () => {
    let server: Server;

    beforeAll(() => {
        server = app.listen(4269); // use your desired port here
    });

    afterAll((done) => {
        server.close(done);
    });

    it('should respond with a JSON object containing a token', async () => {
        mockDb.prototype.get.mockImplementation(function (this: sqlite3.Database, query: string, params: any[], callback: (err: Error | null, row?: any) => void) {
            callback(null, {
                username: 'testuser',
                password: '$2b$10$OUsP6/7dhPKVaxiySaqy0uXfcMyZr2dS/ej2TqVQtRf3elKUo.YbG', // hash of 'password'
            });
            return this;
        });

        const res = await request(server)
            .post('/login')
            .send({ username: 'testuser', password: 'password' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should respond with a status 400 if the user does not exist', async () => {
        mockDb.prototype.get.mockImplementation(function (this: sqlite3.Database, query: string, params: any[], callback: (err: Error | null, row?: any) => void) {
            callback(null);
            return this;
        });

        const res = await request(server)
            .post('/login')
            .send({ username: 'nonexistentuser', password: 'password' });

        expect(res.status).toBe(400);
        expect(res.body).toBe("Wrong password or username");
    });
});
