# Video Consultation Feature - Implementation Plan

## Executive Summary

This document outlines a comprehensive plan for implementing a video consultation feature that allows doctors and patients to conduct real-time video consultations. The solution will integrate with the existing dental clinic management system.

---

## 1. Technology Stack Analysis

### Option A: Third-Party SDK Solutions (Recommended)

#### 1.1 Twilio Video SDK
**Pros:**
- HIPAA-eligible infrastructure
- Robust telemedicine workflows
- SMS integration for patient invitations
- Waiting room functionality
- Multi-device support (web, mobile)
- PSTN dial-in support
- Excellent documentation and support

**Cons:**
- Cost: ~$0.004/min per participant
- Requires Twilio account setup
- Learning curve for API integration

**Best for:** Production-ready, scalable solution with compliance needs

#### 1.2 Whereby Browser SDK
**Pros:**
- React Hooks for easy integration
- Fully customizable UI
- Recording and transcription support
- Simple API
- Good developer experience

**Cons:**
- Less enterprise-focused than Twilio
- Pricing may vary

**Best for:** Quick implementation with custom UI requirements

#### 1.3 Zoom Video SDK
**Pros:**
- Familiar brand name
- Telehealth starter kit available
- Good quality and reliability
- Mobile SDK support

**Cons:**
- More complex setup
- Licensing considerations

**Best for:** Organizations already using Zoom ecosystem

#### 1.4 Agora.io
**Pros:**
- Competitive pricing
- Good quality
- Strong mobile support
- Flexible pricing model

**Cons:**
- Less healthcare-specific features
- Smaller community than Twilio

**Best for:** Cost-sensitive implementations

### Option B: Custom WebRTC Solution

**Pros:**
- Full control
- No per-minute costs
- Complete customization

**Cons:**
- Complex signaling server implementation
- STUN/TURN server management
- Higher development time
- Maintenance overhead
- Security and compliance concerns

**Best for:** Large-scale deployments with dedicated infrastructure team

### Recommendation: **Twilio Video SDK**

Given the healthcare context and need for HIPAA compliance, Twilio Video is recommended for:
- Built-in telemedicine best practices
- HIPAA-eligible infrastructure
- SMS integration for patient notifications
- Waiting room functionality
- Proven reliability

---

## 2. Architecture Overview

### 2.1 System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Patient App   │────────▶│  Video Service  │
│   (React)       │         │  (Twilio/API)   │
└─────────────────┘         └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  Doctor Portal  │────────▶│  Backend API    │
│   (React)       │         │  (Node/Express) │
└─────────────────┘         └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────┐
│         Supabase Database (PostgreSQL)      │
│  - appointments                              │
│  - video_consultations                       │
│  - video_consultation_sessions              │
│  - video_consultation_timings               │
└─────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Appointment Creation**: Patient books appointment with video consultation option
2. **Session Preparation**: Doctor/admin creates video consultation session
3. **Invitation**: System sends SMS/email with video link to patient
4. **Waiting Room**: Patient joins waiting room
5. **Consultation**: Doctor admits patient, video call begins
6. **Recording** (Optional): Session recorded for medical records
7. **Completion**: Session ends, consultation notes saved

---

## 3. Database Schema Design

### 3.1 New Tables

#### `video_consultation_timings`
```sql
CREATE TABLE video_consultation_timings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id),
  doctor_id UUID REFERENCES profiles(id),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_timings_clinic ON video_consultation_timings(clinic_id);
CREATE INDEX idx_video_timings_doctor ON video_consultation_timings(doctor_id);
```

#### `video_consultation_sessions`
```sql
CREATE TABLE video_consultation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  consultation_id UUID REFERENCES consultations(id),
  twilio_room_sid VARCHAR(255) UNIQUE, -- Twilio Room SID
  room_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, waiting, in-progress, completed, cancelled
  doctor_token TEXT, -- Twilio access token for doctor
  patient_token TEXT, -- Twilio access token for patient
  patient_joined_at TIMESTAMP,
  doctor_joined_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  recording_sid VARCHAR(255), -- Twilio recording SID if recorded
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_sessions_appointment ON video_consultation_sessions(appointment_id);
CREATE INDEX idx_video_sessions_status ON video_consultation_sessions(status);
CREATE INDEX idx_video_sessions_room ON video_consultation_sessions(twilio_room_sid);
```

#### `video_consultation_participants`
```sql
CREATE TABLE video_consultation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES video_consultation_sessions(id),
  user_id UUID, -- Can be doctor or patient
  user_type VARCHAR(20) CHECK (user_type IN ('doctor', 'patient')),
  participant_sid VARCHAR(255), -- Twilio participant SID
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  connection_quality JSONB, -- Store connection quality metrics
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_participants_session ON video_consultation_participants(session_id);
```

### 3.2 Modified Tables

#### `appointments` table
```sql
ALTER TABLE appointments 
ADD COLUMN consultation_type VARCHAR(20) DEFAULT 'in-person' 
  CHECK (consultation_type IN ('in-person', 'video', 'hybrid'));

ALTER TABLE appointments
ADD COLUMN video_session_id UUID REFERENCES video_consultation_sessions(id);

CREATE INDEX idx_appointments_consultation_type ON appointments(consultation_type);
```

---

## 4. Backend Implementation

### 4.1 New API Endpoints

#### Video Consultation Management
```
POST   /api/video-consultations/sessions
       Create a new video consultation session
       
GET    /api/video-consultations/sessions/:sessionId
       Get session details
       
POST   /api/video-consultations/sessions/:sessionId/token
       Generate Twilio access token for participant
       
POST   /api/video-consultations/sessions/:sessionId/join
       Mark participant as joined
       
POST   /api/video-consultations/sessions/:sessionId/end
       End the video consultation session
       
GET    /api/video-consultations/sessions/:sessionId/recording
       Get recording URL if available
```

#### Video Consultation Timings
```
GET    /api/video-consultations/timings
       Get video consultation timings for clinic/doctor
       
POST   /api/video-consultations/timings
       Create video consultation timing slot
       
PUT    /api/video-consultations/timings/:id
       Update video consultation timing
       
DELETE /api/video-consultations/timings/:id
       Delete video consultation timing
```

#### Webhooks (Twilio)
```
POST   /api/webhooks/twilio/room-status
       Handle Twilio room status callbacks
       
POST   /api/webhooks/twilio/recording-status
       Handle Twilio recording status callbacks
```

### 4.2 Backend Services

#### `videoConsultation.service.js`
```javascript
// Services for:
// - Creating Twilio rooms
// - Generating access tokens
// - Managing session lifecycle
// - Handling webhooks
```

#### `twilioClient.js`
```javascript
// Twilio SDK wrapper
// - Room creation
// - Token generation
// - Recording management
```

### 4.3 Environment Variables
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_FROM_NUMBER=+1234567890
```

---

## 5. Frontend Implementation

### 5.1 Doctor Portal Components

#### `VideoConsultationRoom.tsx`
- Main video consultation interface
- Video/audio controls
- Screen sharing
- Chat functionality
- Patient waiting room management
- End call button

#### `VideoConsultationSessions.tsx`
- List of scheduled/active video consultations
- Join session button
- Session status indicators

#### `VideoConsultationTimingsPanel.tsx` (Update existing)
- Configure available time slots
- Set duration per slot
- Manage multiple schedules

### 5.2 Patient Portal Components

#### `PatientVideoRoom.tsx`
- Patient-side video interface
- Join waiting room
- Video/audio controls
- Chat with doctor

#### `VideoConsultationInvite.tsx`
- Display invitation link/code
- Instructions for joining
- Test audio/video before joining

### 5.3 Shared Components

#### `VideoControls.tsx`
- Mute/unmute audio
- Enable/disable video
- Screen share toggle
- End call

#### `WaitingRoom.tsx`
- Patient waiting interface
- Doctor admission controls

---

## 6. Integration Points

### 6.1 Appointment System Integration

1. **Appointment Booking**
   - Add "Video Consultation" option during booking
   - Check video consultation availability
   - Link appointment to video session

2. **Appointment Reminders**
   - Send SMS/email with video link 15 minutes before
   - Include instructions for joining

3. **Consultation Flow**
   - After video consultation, transition to regular consultation form
   - Pre-populate consultation notes from video session

### 6.2 Notification System

- **SMS Integration** (Twilio)
  - Appointment confirmation with video link
  - Reminder notifications
  - Session start notifications

- **Email Integration**
  - Detailed instructions
  - Backup link if SMS fails
  - Post-consultation summary

### 6.3 Settings Integration

- Video consultation timings configuration (already in place)
- Default session duration
- Recording preferences
- Notification preferences

---

## 7. Security & Compliance

### 7.1 HIPAA Compliance

- **Twilio HIPAA BAA**: Sign Business Associate Agreement
- **Data Encryption**: All video streams encrypted end-to-end
- **Access Controls**: Role-based access to sessions
- **Audit Logging**: Track all session access
- **Data Retention**: Configure recording retention policies

### 7.2 Security Measures

- **Token Expiration**: Short-lived access tokens (1 hour)
- **Room Access**: Unique room names per session
- **Authentication**: Verify user identity before joining
- **Waiting Room**: Prevent unauthorized access
- **Session Timeout**: Auto-end after maximum duration

### 7.3 Privacy

- **Recording Consent**: Obtain patient consent before recording
- **Data Storage**: Secure storage of recordings
- **Access Logs**: Track who accessed recordings
- **Deletion Policy**: Allow patients to request deletion

---

## 8. User Experience Flow

### 8.1 Doctor Flow

1. View scheduled video consultations in dashboard
2. Click "Start Session" 5 minutes before appointment
3. Join video room (waiting room mode)
4. Patient joins waiting room
5. Doctor admits patient
6. Conduct consultation
7. End session
8. Complete consultation notes
9. Review recording (if applicable)

### 8.2 Patient Flow

1. Receive SMS/email with video link
2. Click link 5 minutes before appointment
3. Grant camera/microphone permissions
4. Join waiting room
5. Wait for doctor to admit
6. Participate in video consultation
7. End session or doctor ends
8. Receive post-consultation summary

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Twilio account and configure HIPAA BAA
- [ ] Create database schema
- [ ] Implement backend API endpoints for session management
- [ ] Set up Twilio webhook handlers
- [ ] Basic video room component (doctor side)

### Phase 2: Core Features (Week 3-4)
- [ ] Patient video room component
- [ ] Waiting room functionality
- [ ] Token generation and authentication
- [ ] Session lifecycle management
- [ ] Integration with appointment system

### Phase 3: Enhanced Features (Week 5-6)
- [ ] Video consultation timings panel (full implementation)
- [ ] SMS/email notifications
- [ ] Recording functionality
- [ ] Chat during consultation
- [ ] Screen sharing

### Phase 4: Polish & Testing (Week 7-8)
- [ ] UI/UX improvements
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation

### Phase 5: Deployment (Week 9)
- [ ] Staging environment testing
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] User training
- [ ] Rollout to clinics

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Token generation logic
- Session creation/management
- Database operations
- Webhook handlers

### 10.2 Integration Tests
- End-to-end video call flow
- Appointment to video session integration
- Notification delivery
- Recording functionality

### 10.3 User Acceptance Testing
- Doctor workflow
- Patient workflow
- Admin configuration
- Error scenarios

### 10.4 Performance Tests
- Concurrent sessions
- Network quality handling
- Load testing
- Stress testing

---

## 11. Monitoring & Analytics

### 11.1 Metrics to Track
- Number of video consultations per day/week
- Average session duration
- Connection quality metrics
- Failed sessions
- Patient satisfaction scores
- Recording usage

### 11.2 Alerts
- Failed session creation
- Webhook failures
- High error rates
- Twilio API issues
- Database connection problems

---

## 12. Cost Estimation

### Twilio Video Costs (Approximate)
- **Video**: $0.004/min per participant
- **SMS**: $0.0075 per message (US)
- **Recording**: $0.0025/min

**Example Monthly Cost:**
- 100 consultations/month × 30 min avg = 3,000 min
- 2 participants × 3,000 min × $0.004 = $24
- 200 SMS notifications × $0.0075 = $1.50
- **Total: ~$25-30/month** (excluding recording)

### Development Costs
- Initial development: 8-9 weeks
- Ongoing maintenance: ~10% of initial cost/year

---

## 13. Alternative: Custom WebRTC Solution

If choosing custom WebRTC instead:

### 13.1 Required Components
- **Signaling Server**: WebSocket server for SDP exchange
- **STUN Server**: Public STUN server (Google, Twilio free)
- **TURN Server**: Self-hosted or cloud TURN server
- **Media Server**: Optional for recording/streaming

### 13.2 Implementation Complexity
- **High**: Requires deep WebRTC knowledge
- **Time**: 12-16 weeks for production-ready solution
- **Maintenance**: Ongoing server management

### 13.3 Recommendation
**Not recommended** unless:
- Very high volume (>1000 consultations/day)
- Specific compliance requirements
- Dedicated infrastructure team
- Budget constraints for third-party services

---

## 14. Risk Assessment

### 14.1 Technical Risks
- **Network Quality**: Poor patient internet affects experience
  - *Mitigation*: Connection quality indicators, fallback to audio-only
  
- **Browser Compatibility**: Not all browsers support WebRTC equally
  - *Mitigation*: Browser detection, provide alternatives
  
- **Twilio Service Outage**: Dependency on third-party
  - *Mitigation*: Monitor Twilio status, have backup plan

### 14.2 Business Risks
- **Patient Adoption**: Patients may prefer in-person
  - *Mitigation*: Clear instructions, support, easy-to-use interface
  
- **Compliance Issues**: HIPAA violations
  - *Mitigation*: Proper BAA, security audits, training

### 14.3 Operational Risks
- **Support Burden**: Technical support for video issues
  - *Mitigation*: Comprehensive documentation, training, FAQ

---

## 15. Success Criteria

### 15.1 Technical Metrics
- ✅ 99%+ session success rate
- ✅ <5 second connection time
- ✅ Support for 50+ concurrent sessions
- ✅ <2% failed sessions

### 15.2 User Metrics
- ✅ 80%+ patient satisfaction score
- ✅ 90%+ doctor adoption rate
- ✅ <5% no-show rate for video consultations
- ✅ Average session duration: 20-40 minutes

### 15.3 Business Metrics
- ✅ 30%+ of consultations via video within 6 months
- ✅ Reduced no-show rates
- ✅ Increased patient reach (remote patients)

---

## 16. Next Steps

1. **Decision**: Choose Twilio Video SDK (recommended)
2. **Setup**: Create Twilio account, configure HIPAA BAA
3. **Planning**: Review and approve this plan
4. **Kickoff**: Begin Phase 1 implementation
5. **Stakeholder Alignment**: Ensure all teams are aligned

---

## 17. Resources & Documentation

### Twilio Resources
- [Twilio Video API Docs](https://www.twilio.com/docs/video)
- [Telemedicine Blueprint](https://www.twilio.com/docs/video/solutions-blueprint-telemedicine-virtual-visits)
- [React Quickstart](https://www.twilio.com/docs/video/quickstart/client/react)

### WebRTC Resources (if custom)
- [WebRTC.org](https://webrtc.org/)
- [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### Compliance
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)
- [Twilio HIPAA Guide](https://www.twilio.com/docs/hipaa)

---

## Appendix A: Code Structure

```
backend/
├── app/
│   ├── controllers/
│   │   └── videoConsultation.controller.js
│   ├── models/
│   │   ├── videoConsultationSession.model.js
│   │   └── videoConsultationTiming.model.js
│   ├── services/
│   │   ├── videoConsultation.service.js
│   │   └── twilioClient.service.js
│   └── routes/
│       └── videoConsultation.routes.js

frontend/
├── src/
│   ├── pages/
│   │   ├── video-consultation/
│   │   │   ├── VideoConsultationRoom.tsx
│   │   │   ├── VideoConsultationSessions.tsx
│   │   │   └── components/
│   │   │       ├── VideoControls.tsx
│   │   │       ├── WaitingRoom.tsx
│   │   │       └── ParticipantList.tsx
│   │   └── settings/
│   │       └── components/
│   │           └── VideoConsultationTimingsPanel.tsx
│   └── lib/
│       └── twilioClient.ts

patient/
├── src/
│   ├── pages/
│   │   └── video-consultation/
│   │       ├── PatientVideoRoom.tsx
│   │       └── VideoInvite.tsx
│   └── lib/
│       └── twilioClient.ts
```

---

## Appendix B: Sample API Request/Response

### Create Video Session
```json
POST /api/video-consultations/sessions
{
  "appointment_id": "uuid-here",
  "duration_minutes": 30
}

Response:
{
  "session_id": "uuid",
  "room_name": "room-abc123",
  "doctor_token": "twilio-token",
  "patient_invite_url": "https://app.example.com/video/room-abc123",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

### Generate Participant Token
```json
POST /api/video-consultations/sessions/:sessionId/token
{
  "user_id": "uuid",
  "user_type": "doctor"
}

Response:
{
  "token": "twilio-access-token",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: Development Team  
**Status**: Draft - Pending Approval
