const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let app;
let db;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // connect mongoose to in-memory server
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // require models (this registers models with mongoose)
  db = require('../app/models');

  // create express app after models loaded
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Profile routes', () => {
  let createdProfileId;
  const clinicId = 'TESTCLINIC1';

  test('POST /api/profile should create a profile', async () => {
    const payload = {
      email: 'doc1@example.com',
      full_name: 'Dr Test One',
      clinic_id: clinicId,
      mobile_number: '9876543210'
    };

    const res = await request(app).post('/api/profile').send(payload);
    expect(res.status).toBe(201);
    // Accept either _id or id
    const newId = res.body._id || res.body.id || (res.body._doc && res.body._doc._id);
    expect(newId).toBeDefined();
    expect((res.body.email || '').toLowerCase()).toBe(payload.email.toLowerCase());
    createdProfileId = String(newId);
  });

  test('GET /api/profile/clinic/:clinicId should return profiles for clinic', async () => {
    const res = await request(app).get(`/api/profile/clinic/${clinicId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(p => (p.email || '').toLowerCase() === 'doc1@example.com');
    if (!found) {
      console.error('GET /api/profile/clinic response body:', res.body);
    }
    expect(found).toBeTruthy();
  });

  test('GET /api/profile/:id should return the profile', async () => {
    const res = await request(app).get(`/api/profile/${createdProfileId}`);
    if (res.status !== 200) console.error('GET by id response:', res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(String(res.body._id)).toBe(String(createdProfileId));
    expect(res.body.full_name).toBe('Dr Test One');
  });

  test('GET /api/profile/:id/slots should return availability and slot duration', async () => {
    const res = await request(app).get(`/api/profile/${createdProfileId}/slots`);
    if (res.status !== 200) console.error('GET slots response:', res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('availability');
    expect(res.body.data).toHaveProperty('slot_duration_minutes');
  });

  test('GET /api/profile/active should include the created profile', async () => {
    const res = await request(app).get('/api/profile/active');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(p => (p.email || '').toLowerCase() === 'doc1@example.com');
    if (!found) console.error('GET /api/profile/active response body:', res.body);
    expect(found).toBeTruthy();
  });

  test('DELETE /api/profile/:id should archive and remove the profile', async () => {
    const res = await request(app).delete(`/api/profile/${createdProfileId}`);
    if (res.status !== 200) console.error('DELETE response:', res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Subsequent get should 404
    const res2 = await request(app).get(`/api/profile/${createdProfileId}`);
    expect(res2.status).toBe(404);

    // Archive should contain original_id mapping
    const archive = await mongoose.connection.collection('profilearchives').findOne({ original_id: mongoose.Types.ObjectId(createdProfileId) });
    expect(archive).toBeTruthy();
  });
});
