import mongoose, { Schema, Document } from "mongoose";

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface IStaffSchedule {
  isAvailable: boolean;
  startTime: string; // Format: "09:00"
  endTime: string; // Format: "18:00"
  breaks: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface IStaff extends Document {
  _id: string;
  vendorId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  specialization: string[];
  services: string[]; // Service IDs they can perform
  isActive: boolean;
  schedule: Record<DayOfWeek, IStaffSchedule>;
  avatar?: string;
  bio?: string;
  experience?: number; // Years of experience
  rating?: number;
  totalBookings?: number;
  hourlyRate?: number;
  commission?: number; // Percentage commission for vendor
  startDate: Date;
  endDate?: Date; // For temporary staff
  createdAt: Date;
  updatedAt: Date;
}

const StaffScheduleSchema = new Schema<IStaffSchedule>(
  {
    isAvailable: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Start time must be in HH:MM format",
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "End time must be in HH:MM format",
      },
    },
    breaks: [
      {
        startTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v: string) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Break start time must be in HH:MM format",
          },
        },
        endTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v: string) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Break end time must be in HH:MM format",
          },
        },
      },
    ],
  },
  { _id: false },
);

const StaffSchema = new Schema<IStaff>(
  {
    vendorId: {
      type: String,
      required: true,
      ref: "User",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
      lowercase: true,
      trim: true,
      maxlength: 100,
      validate: {
        validator: function (v: string) {
          return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      validate: {
        validator: function (v: string) {
          return !v || /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: "Invalid phone number format",
      },
    },
    specialization: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],
    services: [
      {
        type: String,
        ref: "Service",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    schedule: {
      monday: StaffScheduleSchema,
      tuesday: StaffScheduleSchema,
      wednesday: StaffScheduleSchema,
      thursday: StaffScheduleSchema,
      friday: StaffScheduleSchema,
      saturday: StaffScheduleSchema,
      sunday: StaffScheduleSchema,
    },
    avatar: {
      type: String,
      maxlength: 500,
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    experience: {
      type: Number,
      min: 0,
      max: 50,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    commission: {
      type: Number,
      min: 0,
      max: 100,
      default: 10, // 10% default commission
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for faster queries
StaffSchema.index({ vendorId: 1, isActive: 1 });
StaffSchema.index({ services: 1, isActive: 1 });
StaffSchema.index({ vendorId: 1, services: 1, isActive: 1 });
StaffSchema.index({ rating: -1 });
StaffSchema.index({
  firstName: "text",
  lastName: "text",
  specialization: "text",
});

// Virtual for full name
StaffSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to populate vendor info
StaffSchema.virtual("vendor", {
  ref: "User",
  localField: "vendorId",
  foreignField: "_id",
  justOne: true,
});

// Method to check if staff is available on a specific day
StaffSchema.methods.isAvailableOn = function (dayOfWeek: DayOfWeek): boolean {
  const schedule = this.schedule[dayOfWeek];
  return schedule && schedule.isAvailable && this.isActive;
};

// Method to get available time slots for a specific day
StaffSchema.methods.getAvailableSlots = function (
  dayOfWeek: DayOfWeek,
  duration: number, // in minutes
): string[] {
  if (!this.isAvailableOn(dayOfWeek)) {
    return [];
  }

  const schedule = this.schedule[dayOfWeek];
  const slots: string[] = [];

  // This is a simplified version - in production you'd want more sophisticated slot calculation
  const startTime = schedule.startTime;
  const endTime = schedule.endTime;

  // Convert time strings to minutes for easier calculation
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);

  let currentMinutes = startMinutes;

  while (currentMinutes + duration <= endMinutes) {
    const slotTime = minutesToTimeString(currentMinutes);

    // Check if this slot conflicts with breaks
    const conflictsWithBreak = schedule.breaks.some(
      (breakTime: { startTime: string; endTime: string }) => {
        const breakStart = timeStringToMinutes(breakTime.startTime);
        const breakEnd = timeStringToMinutes(breakTime.endTime);
        return (
          currentMinutes < breakEnd && currentMinutes + duration > breakStart
        );
      },
    );

    if (!conflictsWithBreak) {
      slots.push(slotTime);
    }

    currentMinutes += 30; // 30-minute intervals
  }

  return slots;
};

// Method to get safe staff data (without sensitive info)
StaffSchema.methods.toSafeObject = function () {
  const { email, phone, commission, hourlyRate, ...safeStaff } =
    this.toObject();
  return safeStaff;
};

// Helper functions
function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

// Default schedule for new staff (9 AM to 6 PM, Monday to Saturday)
export const defaultStaffSchedule: Record<DayOfWeek, IStaffSchedule> = {
  monday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  tuesday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  wednesday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  thursday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  friday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  saturday: {
    isAvailable: true,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [{ startTime: "13:00", endTime: "14:00" }],
  },
  sunday: {
    isAvailable: false,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  },
};

export default mongoose.models.Staff ||
  mongoose.model<IStaff>("Staff", StaffSchema);
