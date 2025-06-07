import mongoose, { Document, Schema } from 'mongoose';

export interface IDocumentation extends Document {
  sectionId: string;
  title: string;
  content: string;
  lastModified: Date;
  lastModifiedBy: string;
  version: number;
}

const DocumentationSchema = new Schema({
  sectionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'documentation'
});

// Add index for faster queries
DocumentationSchema.index({ sectionId: 1 });

export const Documentation = mongoose.model<IDocumentation>('Documentation', DocumentationSchema); 