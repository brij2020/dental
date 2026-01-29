/**
 * Convert MongoDB patient document to API response format
 * Maps _id to patient_id for consistency with frontend expectations
 */
const formatPatientResponse = (patient) => {
  if (!patient) return null;

  const obj = patient.toObject ? patient.toObject() : patient;

  return {
    ...obj,
    id: obj._id || obj.id,
    patient_id: obj._id || obj.patient_id || obj.id,
  };
};

module.exports = { formatPatientResponse };
