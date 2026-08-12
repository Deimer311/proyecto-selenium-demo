// URLs y variables por ambiente. Cambia con la variable de entorno TEST_ENV.
// Ejemplo: TEST_ENV=staging npm test
const ambientes = {
  dev: { baseUrl: 'http://localhost:9999' },
  staging: { baseUrl: 'https://staging.miapp.com' },
  prod: { baseUrl: 'https://miapp.com' },
};

const ambiente = process.env.TEST_ENV || 'dev';
module.exports = ambientes[ambiente];
