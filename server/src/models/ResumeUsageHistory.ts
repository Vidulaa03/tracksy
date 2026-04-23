import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeUsageHistory extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  oldResumeId?: mongoose.Types.ObjectId | null;
  newResumeId?: mongoose.Types.ObjectId | null;
  changedAt: Date;
}

const resumeUsageHistorySchema = new Schema<IResumeUsageHistory>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    oldResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    newResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    changedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models?.ResumeUsageHistory ||
  mongoose.model<IResumeUsageHistory>('ResumeUsageHistory', resumeUsageHistorySchema);
