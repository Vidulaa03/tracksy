import mongoose, { Schema, Document } from 'mongoose';

export interface IJobApplication extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  position: string;
  description?: string;
  jobDescriptionLink?: string;
  status: 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected';
  appliedDate: Date;
  lastUpdated: Date;
  notes?: string;
  salaryRange?: string;
  linkedResumeId?: mongoose.Types.ObjectId | null;
  events: Array<{
    stage: 'Phone Screen' | 'Interview' | 'Offer' | 'Custom';
    title: string;
    scheduledAt: Date;
    notes?: string;
  }>;
  resumeBullets?: string[];
  parsedData?: {
    companyName?: string;
    role?: string;
    requiredSkills?: string[];
    niceToHaveSkills?: string[];
    seniority?: string;
    location?: string;
    salaryRange?: string;
  };
}

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: { type: String, required: true },
    position:    { type: String, required: true },
    description: { type: String, default: '' },
    jobDescriptionLink: { type: String },
    status: {
      type: String,
      enum: ['applied', 'phone_screen', 'interview', 'offer', 'rejected'],
      default: 'applied',
    },
    appliedDate: { type: Date, default: Date.now },
    notes:       { type: String, default: '' },
    salaryRange: { type: String },
    linkedResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    events: [{
      stage: {
        type: String,
        enum: ['Phone Screen', 'Interview', 'Offer', 'Custom'],
        required: true,
      },
      title: { type: String, required: true },
      scheduledAt: { type: Date, required: true },
      notes: { type: String, default: '' },
    }],
    resumeBullets: [String],
    parsedData: {
      companyName:      String,
      role:             String,
      requiredSkills:   [String],
      niceToHaveSkills: [String],
      seniority:        String,
      location:         String,
      salaryRange:      String,
    },
  },
  { timestamps: { createdAt: false, updatedAt: 'lastUpdated' } }
);

export default mongoose.models?.JobApplication ||
  mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
