import request from 'supertest';
import { app } from '../index';
import { Server } from 'http';

describe('Authentication', () => {
    let server: Server;

    beforeAll((done) => {
        server = app.listen(0, () => {
            done();
        });
    });

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

    beforeAll((done) => {
        server = app.listen(0, () => {
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    it('should respond with a list of packages', async () => {
        const res = await request(server).get('/packages');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should respond with details of a specific package', async () => {
        const packageName = 'some-package-name';
        const res = await request(server).get(`/packages/${packageName}`);

        console.log(res.body);

        expect(res.status).toBe(200);
        expect(typeof res.body).toBe('object');
    });
});
