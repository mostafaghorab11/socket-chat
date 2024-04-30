const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
require("dotenv").config();
const amqp = require("amqplib/callback_api");

const amqpUrl = `amqp://localhost`;
const queueName = "chat_room";

// In-memory message queue (replace with a real message queue in production)
const messageQueue = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

amqp.connect(amqpUrl, (err, conn) => {
  if (err) {
    console.error("Error connecting to RabbitMQ:", err);
    process.exit(1);
  }
  conn.createChannel((err, ch) => {
    if (err) {
      console.error("Error creating RabbitMQ channel:", err);
      process.exit(1);
    }
    ch.assertQueue(queueName, { durable: false });
    io.on("connection", (socket) => {
      console.log("User connected");

      // Handle incoming messages
      socket.on("chat message", (msg) => {
        ch.sendToQueue(queueName, Buffer.from(msg)); // Add message to queue
        io.emit("chat message", msg); // Broadcast to all connected clients
      });

      // Handle disconnections
      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });
  });
});

http.listen(3000, () => {
  console.log("Server listening on port 3000");
});
