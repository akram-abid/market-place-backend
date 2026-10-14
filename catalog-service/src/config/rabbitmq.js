import amqp from "amqplib";
import { json } from "express";

let channel;

export async function connectRabbitMQ() {
  const connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel()
  await channel.assertQueue("product-events")
  console.log("connected to rabbitMQ")
}

export async function publishProductEvent(event) {
    if (!channel) {
        throw new Error("rabbitMQ channel is not initialized")
    }
    channel.sendToQueue("product-events", Buffer.from(JSON.stringify(event)))
}