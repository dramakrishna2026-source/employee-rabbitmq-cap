const cds = require('@sap/cds');
const { publishEmployeeCreated } = require('./rabbitmq');

module.exports = cds.service.impl(function () {
  this.after('CREATE', 'Employees', async (employee, req) => {
    try {
      await publishEmployeeCreated(employee);
      console.log(`[CAP] Employee ${employee.employeeNumber} published to RabbitMQ`);
    } catch (err) {
      // Demo behavior: don't fail employee creation if the broker is temporarily unavailable.
      // For production-grade guaranteed delivery, use a transactional outbox/retry design.
      console.error('[CAP] RabbitMQ publish failed:', err.message);
      req.notify('Employee saved, but RabbitMQ publish failed. Check application logs.');
    }
  });
});
