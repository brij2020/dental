// init-mongo.js - MongoDB Initialization Script

db = db.getSiblingDB('admin');
db.auth('admin', 'admin_password');

// Create dental-clinic database
db = db.getSiblingDB('dental-clinic');

// Create collections with schema validation
db.createCollection('clinics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name'],
      properties: {
        _id: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        phone: { bsonType: 'string' },
        address: { bsonType: 'string' },
        city: { bsonType: 'string' },
        state: { bsonType: 'string' },
        zipCode: { bsonType: 'string' },
        licenseNumber: { bsonType: 'string' },
        registrationDate: { bsonType: 'date' },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'clinic_id', 'role'],
      properties: {
        _id: { bsonType: 'objectId' },
        clinic_id: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        role: { bsonType: 'string', enum: ['admin', 'doctor', 'staff'] },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('patients', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['clinic_id', 'firstName', 'lastName', 'email', 'phone'],
      properties: {
        _id: { bsonType: 'objectId' },
        clinic_id: { bsonType: 'objectId' },
        firstName: { bsonType: 'string' },
        lastName: { bsonType: 'string' },
        email: { bsonType: 'string' },
        phone: { bsonType: 'string' },
        dateOfBirth: { bsonType: 'date' },
        gender: { bsonType: 'string' },
        address: { bsonType: 'string' },
        medicalHistory: { bsonType: 'string' },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('appointments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['clinic_id', 'patient_id', 'doctor_id', 'appointmentDate', 'status'],
      properties: {
        _id: { bsonType: 'objectId' },
        clinic_id: { bsonType: 'objectId' },
        patient_id: { bsonType: 'objectId' },
        doctor_id: { bsonType: 'objectId' },
        appointmentDate: { bsonType: 'date' },
        time: { bsonType: 'string' },
        status: { bsonType: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no-show'] },
        notes: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('procedures', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['clinic_id', 'name', 'procedure_type'],
      properties: {
        _id: { bsonType: 'objectId' },
        clinic_id: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        procedure_type: { bsonType: 'string' },
        description: { bsonType: 'string' },
        cost: { bsonType: 'number' },
        note: { bsonType: 'string' },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('problems', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['clinic_id', 'clinical_findings', 'brief_description', 'treatment_plan', 'icd10_code'],
      properties: {
        _id: { bsonType: 'objectId' },
        clinic_id: { bsonType: 'objectId' },
        clinical_findings: { bsonType: 'string' },
        severity: { bsonType: 'string', enum: ['Mild', 'Moderate', 'Severe', 'Critical'] },
        brief_description: { bsonType: 'string' },
        treatment_plan: { bsonType: 'string' },
        icd10_code: { bsonType: 'string' },
        notes: { bsonType: 'string' },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// ============================================
// CREATE INDEXES FOR PERFORMANCE
// ============================================

// Clinic indexes
db.clinics.createIndex({ email: 1 }, { unique: true });
db.clinics.createIndex({ licenseNumber: 1 }, { unique: true });

// User indexes
db.users.createIndex({ clinic_id: 1 });
db.users.createIndex({ email: 1 });
db.users.createIndex({ clinic_id: 1, role: 1 });

// Patient indexes
db.patients.createIndex({ clinic_id: 1 });
db.patients.createIndex({ email: 1 });
db.patients.createIndex({ phone: 1 });

// Appointment indexes
db.appointments.createIndex({ clinic_id: 1 });
db.appointments.createIndex({ patient_id: 1 });
db.appointments.createIndex({ doctor_id: 1 });
db.appointments.createIndex({ appointmentDate: 1 });
db.appointments.createIndex({ clinic_id: 1, appointmentDate: 1 });

// Procedure indexes
db.procedures.createIndex({ clinic_id: 1 });
db.procedures.createIndex({ name: 1 });

// Problem indexes
db.problems.createIndex({ clinic_id: 1 });
db.problems.createIndex({ icd10_code: 1 });
db.problems.createIndex({ severity: 1 });

// TTL indexes for temporary data (if needed)
// db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

print('✅ Database initialization completed successfully!');
print('Collections created: clinics, users, patients, appointments, procedures, problems');
print('Indexes created for optimal query performance');
