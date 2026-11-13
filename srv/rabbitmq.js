const amqp = require('amqplib');

const queueName = process.env.RABBITMQ_QUEUE || 'employee.created';
let connectionPromise;
let channelPromise;

async function getChannel() {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error('RABBITMQ_URL is not configured. Copy .env.example to .env and add your CloudAMQP AMQPS URL.');
  }

  if (!connectionPromise) {
    connectionPromise = amqp.connect(url).catch((err) => {
      connectionPromise = undefined;
      channelPromise = undefined;
      throw err;
    });
  }

  if (!channelPromise) {
    channelPromise = connectionPromise
      .then((connection) => connection.createConfirmChannel())
      .then(async (channel) => {
        await channel.assertQueue(queueName, { durable: true });
        return channel;
      })
      .catch((err) => {
        channelPromise = undefined;
        throw err;
      });
  }

  return channelPromise;
}

async function publishEmployeeCreated(employee) {
  const channel = await getChannel();
  const payload = {
    event: 'EmployeeCreated',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    data: {
      ID: employee.ID,
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department,
      salary: employee.salary,
      active: employee.active
    }
  };

  channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true, contentType: 'application/json' }
  );

  await channel.waitForConfirms();
}

module.exports = { publishEmployeeCreated };
