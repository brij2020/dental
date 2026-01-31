const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let app;
let db;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // connect mongoose to in-memory server
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // require models (this registers models with mongoose)
  db = require('../app/models');

  // create express app and load routes
  app = require('../server');

  // seed a clinic document with clinic_id 'SUPTEST' (include required fields)
  await db.clinics.create({ clinic_id: 'SUPTEST', name: 'Test Clinic', phone: '9999999999' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('GET /api/clinics/SUPTEST/public returns clinic', async () => {
  const res = await request(app).get('/api/clinics/SUPTEST/public');
  expect(res.status).toBe(200);
  // response may either be the clinic object or an envelope depending on controller
  const body = res.body;
  // Accept either object or { clinic }
  const clinic = body.clinic || body;
  expect(clinic).toBeTruthy();
  expect(clinic.clinic_id).toBe('SUPTEST');
});
