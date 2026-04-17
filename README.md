# PixelSync

PixelSync is a modern, real-time minimalist collaborative workspace. It features a seamless infinite canvas and dynamic flowchart capabilities, allowing teams to ideate, draw, and structure logic effortlessly together in real time.

## 🚀 Features

*   **Real-time Collaboration:** Live multiplayer cursors and instant shape synchronization using WebSockets.
*   **Dual Modes:** Seamlessly switch between a Freeform Canvas for sketching and a structured Flowchart board.
*   **Minimalist Aesthetic:** A highly refined, clean user interface with an eye-friendly warm light mode and a sleek dark mode.
*   **Rich Shape Library:** Includes Rectangles, Circles, Diamonds, Ovals, Triangles, Hexagons, and Stars — accessible via a PowerPoint-style contextual popover.
*   **Dynamic Text & Formatting:** Float text anywhere on the canvas or inside shapes, complete with adjustable font sizes, bold, and italic formatting.
*   **Productivity Tools:** Built-in copy/paste functionality, keyboard shortcuts, undo/redo history, and a quick-search dashboard.

## 🛠️ Tech Stack

*   **Frontend:** Next.js, React, Tailwind CSS
*   **Canvas rendering:** React Konva (for freeform graphics), React Flow (for structured nodes)
*   **Backend:** Node.js, Express, Socket.io (for real-time multiplayer)
*   **Database:** MongoDB, Mongoose
*   **Authentication:** JWT (JSON Web Tokens)

## 💻 Running Locally

### 1. Requirements
Ensure you have Node.js and npm installed on your machine.

### 2. Environment Variables
Create a `.env` file in the root of the project with the following keys:
```env
# Your MongoDB connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pixelsync

# A random secret string for user authentication
JWT_SECRET=your_super_secret_jwt_key

# The port your backend server will run on
PORT=5000
```

### 3. Start the Backend Server
Open a terminal in the root directory and run:
```bash
npm install
node server/server.js
# Or if you have nodemon installed: nodemon server/server.js
```

### 4. Start the Frontend App
Open a *second* terminal in the same root directory and run:
```bash
npm run dev
```

The application will now be running on `http://localhost:3000`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is for educational and portfolio purposes.
