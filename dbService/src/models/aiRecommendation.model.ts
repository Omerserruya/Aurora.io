import mongoose, { Schema, Document } from 'mongoose';

export interface IAIRecommendation extends Document {
  userId: string;
  connectionId: string;
  title: string;
  problem: string;
  impact: string;
  solution: string;
  color: 'error' | 'warning' | 'success' | 'info';
  icon: string;
  chatPrompt: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIRecommendationSchema = new Schema({
  userId: { type: String, required: true },
  connectionId: { type: String, required: true },
  title: { type: String, required: true },
  problem: { type: String, required: true },
  impact: { type: String, required: true },
  solution: { type: String, required: true },
  color: { type: String, required: true, enum: ['error', 'warning', 'success', 'info'] },
  icon: { type: String, required: true },
  chatPrompt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound index for userId and connectionId
AIRecommendationSchema.index({ userId: 1, connectionId: 1 });

export const AIRecommendation = mongoose.model<IAIRecommendation>('AIRecommendation', AIRecommendationSchema); 