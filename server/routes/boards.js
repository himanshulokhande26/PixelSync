const express = require('express');
const { nanoid } = require('nanoid');
const Board = require('../models/Board');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route  GET /api/boards/content/:boardId
// @desc   Load board elements (public - link is the key)
// @access Public
router.get('/content/:boardId', async (req, res) => {
  try {
    const board = await Board.findOne({ boardId: req.params.boardId });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    res.json({ elements: board.elements, nodes: board.nodes, edges: board.edges, title: board.title, type: board.type });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  PUT /api/boards/content/:boardId
// @desc   Save board elements (public - link is the key)
// @access Public
router.put('/content/:boardId', async (req, res) => {
  try {
    const { elements, nodes, edges } = req.body;
    const board = await Board.findOneAndUpdate(
      { boardId: req.params.boardId },
      { elements, nodes, edges, updatedAt: new Date() },
      { new: true }
    );
    if (!board) return res.status(404).json({ message: 'Board not found' });
    res.json({ message: 'Saved', updatedAt: board.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/boards
// @desc   Get all boards for logged in user
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const boards = await Board.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/boards
// @desc   Create a new board
// @access Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, type } = req.body;
    const boardId = `${nanoid(10)}`; // e.g. "V1StGXR8_Z"

    const board = await Board.create({
      title: title || 'Untitled Board',
      type: type || 'canvas',
      boardId,
      owner: req.user._id,
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  PATCH /api/boards/:id
// @desc   Rename a board
// @access Private
router.patch('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    board.title = req.body.title || board.title;
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  DELETE /api/boards/:id
// @desc   Delete a board
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await board.deleteOne();
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
