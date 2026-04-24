import mongoose, { Schema, Document } from 'mongoose';

export interface IParsedData {
  keyRequirements?: string[];
  skills?: string[];
  experience?: string;
  salaryRange?: string;
}

export interface IJobApplication extends Document {
  userId: mongoose.Types.ObjectId;
  jobTitle: string;
  companyName: string;
  status: 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected';
  description: string;
  applicationDate: Date;
  notes?: string;
  parsedData?: IParsedData;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Please provide a job title'],
    },
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
    },
    status: {
      type: String,
      enum: ['applied', 'phone_screen', 'interview', 'offer', 'rejected'],
      default: 'applied',
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    parsedData: {
      keyRequirements: [String],
      skills: [String],
      experience: String,
      salaryRange: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.JobApplication || 
  mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
