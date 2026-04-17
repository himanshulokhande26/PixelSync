const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));

app.get('/', (req, res) => res.send('PixelSync API is running...'));

// In-memory store: boardId -> Map of { socketId -> { userId, name, color } }
const boardRooms = {};

// Color palette for collaborators
const COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#a855f7', '#ec4899'];
let colorIndex = 0;

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  let currentBoardId = null;
  let currentUser = null;

  // --- Join a board room ---
  socket.on('join_board', ({ boardId, name }) => {
    currentBoardId = boardId;
    const color = COLORS[colorIndex % COLORS.length];
    colorIndex++;

    currentUser = {
      socketId: socket.id,
      userId: socket.id, // Use socketId as userId for now (no auth yet)
      name: name || 'Anonymous',
      color,
      cursorX: 0,
      cursorY: 0,
    };

    socket.join(boardId);

    // Initialize room if it doesn't exist
    if (!boardRooms[boardId]) boardRooms[boardId] = {};
    boardRooms[boardId][socket.id] = currentUser;

    // Send current collaborators list back to the joining user
    socket.emit('room_state', {
      collaborators: Object.values(boardRooms[boardId]).filter(u => u.socketId !== socket.id),
    });

    // Notify everyone else that a new user joined
    socket.broadcast.to(boardId).emit('user_joined', currentUser);
    console.log(`${currentUser.name} joined board: ${boardId}`);
  });

  // --- Broadcast new drawing element ---
  socket.on('draw_element', ({ boardId, element }) => {
    socket.broadcast.to(boardId).emit('draw_element', element);
  });

  // --- Broadcast element updates (drag/resize) ---
  socket.on('update_element', ({ boardId, id, elementData }) => {
    socket.broadcast.to(boardId).emit('update_element', { id, elementData });
  });

  // --- Broadcast element deletions ---
  socket.on('delete_elements', ({ boardId, ids }) => {
    socket.broadcast.to(boardId).emit('delete_elements', ids);
  });

  // --- Broadcast cursor position ---
  socket.on('cursor_move', ({ boardId, x, y }) => {
    if (!currentUser) return;
    currentUser.cursorX = x;
    currentUser.cursorY = y;
    socket.broadcast.to(boardId).emit('cursor_move', {
      userId: currentUser.userId,
      name: currentUser.name,
      color: currentUser.color,
      x,
      y,
    });
  });

  // --- Flowchart real-time sync ---
  // Store latest flowchart state per board in memory
  if (!global.flowStates) global.flowStates = {};

  socket.on('flow_update', ({ boardId, nodes, edges }) => {
    // Cache the latest state for new joiners
    if (!global.flowStates[boardId]) global.flowStates[boardId] = {};
    global.flowStates[boardId] = { nodes, edges };
    // Broadcast to everyone else in the room
    socket.broadcast.to(boardId).emit('flow_update', { nodes, edges });
  });

  socket.on('request_flow_state', ({ boardId }) => {
    // Send the cached flowchart state to the requesting user
    const state = global.flowStates?.[boardId];
    if (state) socket.emit('flow_state', state);
  });


  // --- Handle disconnect ---
  socket.on('disconnect', () => {
    if (currentBoardId && boardRooms[currentBoardId]) {
      delete boardRooms[currentBoardId][socket.id];
      if (Object.keys(boardRooms[currentBoardId]).length === 0) {
        delete boardRooms[currentBoardId]; // Clean up empty rooms
      }
    }
    if (currentBoardId && currentUser) {
      io.to(currentBoardId).emit('user_left', { userId: currentUser.userId });
      console.log(`${currentUser?.name} left board: ${currentBoardId}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
