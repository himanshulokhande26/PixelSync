<div align="center">

<img src="https://img.shields.io/badge/PixelSync-Real--time%20Canvas-6366f1?style=for-the-badge&logoColor=white" alt="PixelSync" />

# ✦ PixelSync

### A real-time minimalist collaborative workspace — draw, ideate, and structure logic together.

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-pixel--sync--mu.vercel.app-6366f1?style=flat-square)](https://pixel-sync-mu.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-90.5%25-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://github.com/himanshulokhande26/PixelSync)
[![Next.js](https://img.shields.io/badge/Next.js-Framework-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-Portfolio%20%2F%20Educational-f59e0b?style=flat-square)](#license)

---

</div>

## 📌 What is PixelSync?

**PixelSync** is a modern collaborative whiteboard built for teams that think visually. Whether you're sketching a UI wireframe, mapping out a system architecture, or brainstorming with your team — PixelSync gives you a shared infinite canvas that updates live for every participant.

Two powerful modes. One seamless experience.

| Mode | Description |
|------|-------------|
| 🎨 **Freeform Canvas** | Sketch, draw, and annotate freely on an infinite infinite canvas using React Konva |
| 🔗 **Flowchart Board** | Build structured node graphs and logic diagrams using React Flow |

---

## ✨ Features

### 🤝 Real-time Collaboration
- Live multiplayer cursors — see exactly where your teammates are
- Instant shape synchronization powered by **WebSockets (Socket.io)**
- Changes propagate to all connected clients with zero lag

### 🖼️ Rich Canvas Toolkit
- **Shape Library** — Rectangles, Circles, Diamonds, Ovals, Triangles, Hexagons, Stars
- **Dynamic Text** — Float text anywhere on the canvas or inside shapes
- **Text Formatting** — Adjustable font sizes, bold, and italic support
- PowerPoint-style contextual popover for shape selection

### ⌨️ Productivity First
- `Ctrl+Z / Ctrl+Y` — Undo/Redo history
- `Ctrl+C / Ctrl+V` — Copy/Paste shapes
- Keyboard shortcuts throughout
- Quick-search dashboard for navigating boards

### 🌓 Beautiful UI
- Warm **light mode** and refined **dark mode**
- Minimalist aesthetic — no clutter, just your ideas
- Responsive and performant across screen sizes

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js · React · TypeScript · Tailwind CSS |
| **Canvas (Freeform)** | React Konva |
| **Canvas (Flowchart)** | React Flow |
| **Backend** | Node.js · Express.js |
| **Real-time** | Socket.io |
| **Database** | MongoDB · Mongoose |
| **Auth** | JWT (JSON Web Tokens) |
| **Deployment** | Vercel (Frontend) |

</div>

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- A [MongoDB](https://www.mongodb.com/atlas) database (Atlas free tier works great)

---

### 1. Clone the Repository

```bash
git clone https://github.com/himanshulokhande26/PixelSync.git
cd PixelSync
```

---

### 2. Configure Environment Variables

Create a `.env` file in the **root** of the project:

```env
# MongoDB connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pixelsync

# Secret key for JWT authentication
JWT_SECRET=your_super_secret_jwt_key

# Port for the backend server
PORT=5000
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Start the Backend Server

Open a terminal in the root directory:

```bash
node server/server.js

# Or with auto-reload (recommended for development):
nodemon server/server.js
```

The backend will start on **http://localhost:5000**

---

### 5. Start the Frontend

Open a **second terminal** in the same root directory:

```bash
npm run dev
```

The app will be live at **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
PixelSync/
├── server/                  # Backend — Node.js + Express + Socket.io
│   └── server.js            # Main server entry point
├── src/                     # Frontend — Next.js + React
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   └── ...
├── .env                     # Environment variables (not committed)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🌐 Live Demo

Try PixelSync live — no sign-up required to explore:

**[https://pixel-sync-mu.vercel.app](https://pixel-sync-mu.vercel.app)**

---

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

1. **Fork** the repository
2. **Create** a feature branch — `git checkout -b feature/your-feature-name`
3. **Commit** your changes — `git commit -m 'Add: your feature description'`
4. **Push** to your branch — `git push origin feature/your-feature-name`
5. **Open** a Pull Request

Please open an [Issue](https://github.com/himanshulokhande26/PixelSync/issues) first for major changes so we can discuss the approach.

---

## 📄 License

This project is built for **educational and portfolio purposes**.  
Feel free to explore, learn from, and fork it.

---

<div align="center">

Made with ❤️ by [Himanshu Lokhande](https://himanshulokhande.in)

[![GitHub](https://img.shields.io/badge/GitHub-himanshulokhande26-181717?style=flat-square&logo=github)](https://github.com/himanshulokhande26)
[![Portfolio](https://img.shields.io/badge/Portfolio-himanshulokhande.in-6366f1?style=flat-square&logo=vercel&logoColor=white)](https://himanshulokhande.in)

⭐ If you found this useful, consider giving it a star!

</div>
