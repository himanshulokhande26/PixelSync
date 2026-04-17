const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Board',
  },
  type: {
    type: String,
    enum: ['canvas', 'flowchart'],
    default: 'canvas',
  },
  boardId: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  elements: {
    type: Array,
    default: [],
  },
  // React Flow flowchart state
  nodes: {
    type: Array,
    default: [],
  },
  edges: {
    type: Array,
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);
