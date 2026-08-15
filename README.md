# SyncSpace – Real-Time Collaborative Whiteboard & Code Editor

## Overview

SyncSpace is a real-time collaboration platform that enables multiple users to work together on a shared whiteboard and code editor simultaneously. The project demonstrates advanced MERN Stack concepts including real-time communication, collaborative editing, and modern frontend development.

This repository contains the **Frontend (UI)** developed using React.

---

## Problem Statement

Traditional web applications follow a request-response model where users interact independently. Modern collaborative applications require multiple users to edit the same content simultaneously while maintaining consistency and preventing data conflicts.

SyncSpace solves this problem by integrating real-time synchronization technologies that allow users to collaborate on drawings and code without overwriting each other's changes.

---

## Features

- Real-time collaborative code editor
- Shared interactive whiteboard
- Live cursor synchronization
- Multi-user collaboration
- Join Room functionality
- Responsive user interface
- WebSocket-based communication
- Conflict-free document synchronization using Yjs
- Modern React-based architecture

---

## Technologies Used

### Frontend
- React.js
- Vite
- HTML5
- CSS3
- JavaScript (ES6+)

### Libraries
- Monaco Editor
- Yjs
- Socket.IO Client
- React Router
- Konva.js / Fabric.js (Whiteboard)

### Backend (Project Integration)
- Node.js
- Express.js
- MongoDB
- Socket.IO
- Yjs WebSocket Server

---

## Project Structure

```text
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── styles/
│   └── App.jsx
```

## How It Works

1. User joins a collaboration room.
2. The frontend connects to the backend using Socket.IO.
3. Yjs synchronizes the document state across all connected users.
4. Every drawing stroke or code edit is instantly reflected on every connected client.
5. CRDTs ensure conflict-free merging of simultaneous edits.

---

## Learning Outcomes

- Real-time application development
- WebSocket communication
- Collaborative editing using CRDTs
- React component architecture
- State synchronization
- Frontend performance optimization

---

## Future Improvements

- User authentication
- Video conferencing
- Voice chat
- Screen sharing
- File sharing
- Multiple collaborative rooms
- Chat system
- Version history
- Dark/Light theme
- AI-powered code suggestions

---

## Author

Navneet kumar
Frontend Developer
United University
B.Tech CSE

