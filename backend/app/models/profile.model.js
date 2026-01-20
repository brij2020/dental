const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");
const bcrypt = require("bcryptjs");
const { DEFAULT_AVAILABILITY } = require("../constants/defaultSchedule");
const doctorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
     mobile_number: {
      type: String,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"]
    },

    full_name: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.DOCTOR
    },

    clinic_id: {
      type: String,
      ref: "Clinic",
      required: true
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },

    availability: {
      type: Object, // flexible schedule (jsonb style)
      default: () => JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY))
    },
     leave: [
      {
        day: {
          type: String,
          // enum: [
          //   "Monday",
          //   "Tuesday",
          //   "Wednesday",
          //   "Thursday",
          //   "Friday",
          //   "Saturday",
          //   "Sunday"
          // ],
          required: true
        },
        date: {
          type: String, // store as YYYY-MM-DD
          required: true
        },
      }
    ],

    slot_duration_minutes: {
      type: Number,
      default: 15
    },

    profile_pic: {
      type: String // image URL
    },

    education: {
      type: [String]
    },

    years_of_experience: {
      type: Number
    },

    specialization: {
      type: [String]
    },

    bio: {
      type: String
    },

    password: {
      type: String,
      select: false
    },
    capacity: {
      type: String,
      default: "1x"
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);
/**
 * Pre-save hook to hash password
 */
doctorSchema.pre("save", async function(next) {
  const user = this;
  const bcrypt = require("bcryptjs");
  const { logger } = require("../config/logger");

  // Only hash if password is new or modified
  if (!user.isModified("password")) {
    logger.debug({ userId: user._id }, 'Password not modified, skipping hash');
    return next();
  }

  try {
    logger.debug({ userId: user._id, passwordLength: user.password.length }, 'Password hashing started');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    logger.debug({ userId: user._id, hashedLength: hashedPassword.length, startsWithHash: hashedPassword.startsWith('$2') }, 'Password hashed successfully');
    user.password = hashedPassword;
    next();
  } catch (err) {
    logger.error({ userId: user._id, err }, 'Error hashing password');
    next(err);
  }
});

/**
 * Instance method to compare password
 */
doctorSchema.methods.comparePassword = async function(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};
module.exports = mongoose.model("Profile", doctorSchema);
