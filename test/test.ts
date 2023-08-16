import request from 'supertest';
import { app } from '../index';
import { Server } from 'http';

describe('POST /login', () => {
    let server: Server;

    let port: number;

    beforeAll((done) => {
        server = app.listen(0, () => {
            port = (server.address() as any).port;
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

        console.log(res.body);
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
