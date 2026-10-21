import amqp from "amqplib";
import { deleteProductFromIndex, esClient, indexProduct, PRODUCTS_INDEX } from "./elasticsearch.js";

export async function startConsumer() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue("product-events");

  channel.consume("product-events", async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log("Received event:", event.type);

    if (event.type === "product.created" || event.type === "product.updated") {
      await indexProduct(event.product);
    } else if (event.type === "product.deleted") {
      await deleteProductFromIndex(event.product.id);
    }

    channel.ack(msg);
  });

  console.log("Listening for product events...");
}
