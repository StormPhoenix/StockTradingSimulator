/**
 * Project Model - MongoDB schema for project information
 * 
 * @description Defines the structure for storing project metadata,
 * technology stack, features, and status information.
 */

import mongoose from 'mongoose';

// Feature sub-schema for project features
const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed'],
    default: 'planned'
  }
}, { _id: false });

// Main project schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  version: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate semver format (x.y.z)
        return /^\d+\.\d+\.\d+$/.test(v);
      },
      message: 'Version must be in semver format (x.y.z)'
    }
  },
  technologies: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  features: [featureSchema],
  repository: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Validate URL format
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Repository must be a valid HTTP/HTTPS URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for feature count
projectSchema.virtual('featureCount').get(function() {
  return this.features ? this.features.length : 0;
});

// Indexes for performance
projectSchema.index({ name: 1 });
projectSchema.index({ isActive: 1 });
projectSchema.index({ createdAt: -1 });

// Ensure only one active project at a time
projectSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    // Deactivate all other projects
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

// Static method to get active project
projectSchema.statics.getActiveProject = function() {
  return this.findOne({ isActive: true });
};

// Instance method to activate project
projectSchema.methods.activate = async function() {
  // Deactivate all other projects
  await this.constructor.updateMany({}, { isActive: false });
  // Activate this project
  this.isActive = true;
  return this.save();
};

const Project = mongoose.model('Project', projectSchema);

export default Project;