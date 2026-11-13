# Employee CAP + RabbitMQ (CloudAMQP)

A beginner-friendly SAP CAP Node.js project:
- OData V4 employee service
- SQLite database (no HANA Cloud required)
- RabbitMQ producer triggered after Employee CREATE
- Separate Node.js RabbitMQ consumer

## Architecture

Postman / browser -> CAP OData V4 -> SQLite
                                  |
                                  | EmployeeCreated event
                                  v
                           RabbitMQ queue
                                  |
                                  v
                         Node.js consumer

## Requirements

- Node.js 20+ (Node.js 22 LTS is a good choice)
- npm
- SAP Business Application Studio (BAS) or local VS Code
- A RabbitMQ endpoint, for example a CloudAMQP instance

## 1. Create the RabbitMQ broker

1. Create an account at https://www.cloudamqp.com/
2. Create an instance using the free plan available to your account (if offered).
3. Open the instance details and copy its AMQPS URL.
4. Keep the URL private. It contains credentials.

## 2. Configure this project

In the project root:

```bash
cp .env.example .env
```

Edit `.env` and replace the sample value with your actual AMQPS URL:

```env
RABBITMQ_URL=amqps://USERNAME:PASSWORD@HOSTNAME/VHOST
RABBITMQ_QUEUE=employee.created
```

Do not add quotation marks unless your shell/tool requires them. Do not commit `.env` to Git.

Install dependencies:

```bash
npm install
```

## 3. Start the RabbitMQ consumer

Open Terminal 1:

```bash
npm run consumer
```

Expected output:

```text
[Consumer] Waiting for messages on queue: employee.created
```

Keep this terminal running.

## 4. Start the CAP application

Open Terminal 2:

```bash
npm start
```

CAP normally starts at `http://localhost:4004`.

Open the service document:

`http://localhost:4004/odata/v4/employee/`

Open employee collection:

`http://localhost:4004/odata/v4/employee/Employees`

## 5. Create an employee

Use Postman:

- Method: POST
- URL: `http://localhost:4004/odata/v4/employee/Employees`
- Header: `Content-Type: application/json`
- Body -> raw -> JSON:

```json
{
  "employeeNumber": "EMP1003",
  "firstName": "Arjun",
  "lastName": "Rao",
  "email": "arjun.rao@example.com",
  "department": "Finance",
  "salary": 72000,
  "active": true
}
```

A successful create should return the employee record. In Terminal 2, CAP logs that it published the employee event. In Terminal 1, the consumer prints the received JSON message.

## 6. Common checks

- `RABBITMQ_URL is not configured`: ensure `.env` exists in the project root. CAP loads `.env` automatically; `consumer.js` loads it using `dotenv`.
- `ACCESS_REFUSED`: verify username, password, and virtual host in the AMQPS URL.
- TLS/connection error: copy the AMQPS URL from CloudAMQP; do not manually change `amqps://` to `amqp://`.
- No consumer output: make sure `npm run consumer` is running and both processes use the same queue name and broker URL.

## Important production note

This is a learning sample. The `after CREATE` hook publishes to RabbitMQ, but a database commit and a broker publish are not one atomic transaction. For production, use a transactional outbox/retry strategy so events are not lost or duplicated around failures.

## Files

- `db/schema.cds`: Employee data model
- `db/data/employee-Employees.csv`: sample employee records
- `srv/employee-service.cds`: OData V4 service
- `srv/employee-service.js`: publishes after employee creation
- `srv/rabbitmq.js`: RabbitMQ publisher
- `consumer.js`: RabbitMQ queue consumer
