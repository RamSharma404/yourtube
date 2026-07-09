const rooms = {};

export const setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      rooms[roomId] = rooms[roomId] || [];
      rooms[roomId].push(socket.id);
      socket.to(roomId).emit("user-joined", socket.id);
      socket.emit("room-users", rooms[roomId].filter((id) => id !== socket.id));
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        if (rooms[roomId].length === 0) delete rooms[roomId];
      }
      socket.to(roomId).emit("user-left", socket.id);
    });

    socket.on("offer", ({ to, offer }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("toggle-mic", ({ roomId, muted }) => {
      socket.to(roomId).emit("mic-toggled", { userId: socket.id, muted });
    });

    socket.on("toggle-camera", ({ roomId, enabled }) => {
      socket.to(roomId).emit("camera-toggled", { userId: socket.id, enabled });
    });

    socket.on("screen-share-started", ({ roomId }) => {
      socket.to(roomId).emit("screen-share-started", { userId: socket.id });
    });

    socket.on("screen-share-stopped", ({ roomId }) => {
      socket.to(roomId).emit("screen-share-stopped", { userId: socket.id });
    });

    socket.on("youtube-url-shared", ({ roomId, url }) => {
      socket.to(roomId).emit("youtube-url-shared", { userId: socket.id, url });
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        const idx = rooms[roomId].indexOf(socket.id);
        if (idx !== -1) {
          rooms[roomId].splice(idx, 1);
          socket.to(roomId).emit("user-left", socket.id);
          if (rooms[roomId].length === 0) delete rooms[roomId];
        }
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
