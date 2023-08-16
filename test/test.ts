import request from 'supertest';
import { app } from '../index';
import { Server } from 'http';
import fs from 'fs';
import path from 'path';

describe('Authentication', () => {
    let server: Server;

    beforeAll(async () => {
        server = app.listen(0, () => {
            const address = server.address();
            const port = typeof address === 'string' ? address : address?.port;
            console.log(`Listening on port ${port}`);
        });
    }, 10000);


    afterAll((done) => {
        server.close(done);
    });

    it('should respond with a JSON object containing a token', async () => {
        const res = await request(server)
            .post('/login')
            .send({ username: 'testuser', password: 'password' });

        expect(res.status).toBe(200);
        expect(typeof res.body).toBe('string');
    });

    it('should respond with a status 400 if the user does not exist', async () => {
        const res = await request(server)
            .post('/login')
            .send({ username: 'nonexistentuser', password: 'password' });

        expect(res.status).toBe(400);
        expect(res.body).toBe("Wrong password or username");
    });
});

describe('Package Management', () => {
    let server: Server;
    let token: string;

    beforeAll(async () => {
        server = app.listen(0, () => {
            console.log(`Listening on port ${server.address()}`);
        });
        token = await authenticateAs(server, 'testuser', 'password');
    }, 10000);

    afterAll((done) => {
        server.close(done);
    });

    it('should respond with a list of packages', async () => {
        const res = await request(server).get('/packages');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should upload a package and find it', async () => {
        const randomName = 'temp-file.txt';
        console.log(__dirname);
        const filePath = path.join(__dirname, '..', 'packages', 'temp-file.txt');

        fs.writeFileSync(filePath, '');

        let res = await request(server)
            .post('/upload')
            .set('auth-token', token)
            .attach('package', filePath, randomName);

        expect(res.status).toBe(200);

        res = await request(server).get(`/packages/${randomName}`);
        expect(res.status).toBe(200);

        console.log(res.body);
        expect(res.body.name).toBe(randomName);

        fs.unlinkSync(filePath);
    });
});

async function authenticateAs(server: Server, username: string, password: string): Promise<string> {
    const res = await request(server)
        .post('/login')
        .send({ username, password });

    return res.body;
}
