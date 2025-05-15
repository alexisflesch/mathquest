import request from 'supertest';
import { app } from '@/server'; // Import app instead of server

describe('GET /health', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    });

    // Optional: Test for a non-existent route to ensure 404 handling (if you have it)
    // it('should return 404 for a non-existent route', async () => {
    //   const res = await request(app).get('/non-existent-route');
    //   expect(res.statusCode).toEqual(404);
    // });
});
