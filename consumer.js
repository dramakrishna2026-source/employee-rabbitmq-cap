require('dotenv').config();

const amqp = require('amqplib');

const queueName = process.env.RABBITMQ_QUEUE || 'employee.created';

async function main() {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error('RABBITMQ_URL is not configured. Copy .env.example to .env and add your CloudAMQP AMQPS URL.');
  }

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });
  await channel.prefetch(1);

  console.log(`[Consumer] Waiting for messages on queue: ${queueName}`);

  channel.consume(queueName, async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString());
      console.log('\\n[Consumer] Message received:');
      console.log(JSON.stringify(event, null, 2));

      if (event.event === 'EmployeeCreated') {
        console.log(`[Consumer] Welcome workflow triggered for ${event.data.firstName} (${event.data.employeeNumber})`);
      }

      channel.ack(message);
    } catch (err) {
      console.error('[Consumer] Message processing failed:', err.message);
      // Reject without requeue for this beginner demo to avoid an endless poison-message loop.
      channel.nack(message, false, false);
    }
  });

  const shutdown = async () => {
    console.log('\\n[Consumer] Shutting down...');
    await channel.close().catch(() => {});
    await connection.close().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[Consumer] Startup failed:', err.message);
  process.exit(1);
});
