import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content?: string;       // legacy text-based resume
  filename?: string;      // stored filename on disk
  originalName?: string;  // original upload name shown to user
  filepath?: string;      // relative path: uploads/resumes/<filename>
  size?: number;          // file size in bytes
  mimeType?: string;      // application/pdf
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:        { type: String, required: true },
    content:      { type: String },
    filename:     { type: String },
    originalName: { type: String },
    filepath:     { type: String },
    size:         { type: Number },
    mimeType:     { type: String },
    isDefault:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IResume>('Resume', resumeSchema);
