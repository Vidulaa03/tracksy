import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    title: {
      type: String,
      default: 'General Resume',
    },
    version: {
      type: String,
      default: 'v1',
    },
    content: {
      type: String,
      required: [true, 'Please provide resume content'],
    },
    structuredData: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
