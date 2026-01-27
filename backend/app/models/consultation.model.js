const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    clinic_id: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    patient_id: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    doctor_id: {
      type: String,
      required: false,
      default: null,
      index: true,
      trim: true
    },
    chief_complaints: {
      type: String,
      trim: true,
      default: null
    },
    on_examination: {
      type: String,
      trim: true,
      default: null
    },
    advice: {
      type: String,
      trim: true,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: null
    },
    consultation_fee: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    other_amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    procedure_amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    total_amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    total_paid: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    amount_due: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    previous_outstanding_balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    medical_history: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["Draft", "Completed", "Cancelled"],
      default: "Draft",
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one consultation per appointment
consultationSchema.index({ appointment_id: 1 }, { unique: true });

// Indexes for common queries
consultationSchema.index({ clinic_id: 1, status: 1 });
consultationSchema.index({ patient_id: 1, status: 1 });
consultationSchema.index({ doctor_id: 1, status: 1 });
consultationSchema.index({ created_at: -1 });

module.exports = mongoose.model("Consultation", consultationSchema);
