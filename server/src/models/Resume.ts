import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  targetRole?: string;
  skills: string[];
  experienceLevel?: 'student' | 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  tags: string[];
  content?: string;       // legacy text-based resume
  filename?: string;      // stored filename on disk
  originalName?: string;  // original upload name shown to user
  filepath?: string;      // relative path: uploads/resumes/<filename>
  size?: number;          // file size in bytes
  mimeType?: string;      // application/pdf
  fileHash?: string;
  atsScore?: number;
  isDefault: boolean;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:        { type: String, required: true },
    targetRole:   { type: String },
    skills:       { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ['student', 'fresher', 'junior', 'mid', 'senior', 'lead'],
    },
    tags:         { type: [String], default: [] },
    content:      { type: String },
    filename:     { type: String },
    originalName: { type: String },
    filepath:     { type: String },
    size:         { type: Number },
    mimeType:     { type: String },
    fileHash:     { type: String },
    atsScore:     { type: Number },
    isDefault:    { type: Boolean, default: false },
    lastUsedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IResume>('Resume', resumeSchema);
