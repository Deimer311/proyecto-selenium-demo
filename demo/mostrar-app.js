// Script para MOSTRAR la app en vivo durante la exposición.
//
// Abre UN SOLO navegador (sin parpadeo, sin abrir/cerrar ventanas de más),
// recorre en vivo el mismo escenario que prueban los tests automatizados
// (login fallido → login correcto), narrando el resultado en la terminal,
// y al final deja el navegador quieto en la página de bienvenida hasta que
// tú decidas cerrarlo.
//
// Se ejecuta con: npm run demo
const readline = require('readline');
const assert = require('assert');
const { By } = require('selenium-webdriver');
const { crearDriver } = require('../drivers/driverFactory');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const { esperarVisible, esperarUrlContiene } = require('../utils/waits');
const config = require('../config/environments');

async function paso(nombre, fn) {
  try {
    await fn();
    console.log(`  OK    - ${nombre}`);
  } catch (err) {
    console.log(`  FALLA - ${nombre}`);
    console.log(`          ${err.message}`);
  }
}

(async function mostrarDemo() {
  const driver = await crearDriver('chrome', false);
  const loginPage = new LoginPage(driver);

  console.log('\nDemo en vivo — Selenium WebDriver\n');
  await driver.get(`${config.baseUrl}/login`);

  await paso('Debería mostrar error con credenciales inválidas', async () => {
    await loginPage.login('correo_falso@gmail.com', 'ClaveIncorrecta');
    await esperarVisible(driver, By.css('.error-message'));
    const mensaje = await loginPage.obtenerMensajeError();
    assert.ok(mensaje.includes('inválid'));
  });

  await paso('Debería acceder al dashboard con credenciales válidas', async () => {
    await loginPage.login('cliente@gmail.com', '123456');
    await esperarUrlContiene(driver, 'dashboard');
    const dashboardPage = new DashboardPage(driver);
    const titulo = await dashboardPage.obtenerTitulo();
    assert.ok(titulo.includes('Dashboard'));
  });

  console.log('\nListo. La página de bienvenida se queda abierta para que la muestres.');
  console.log('Presiona ENTER en esta terminal cuando termines de explicar, para cerrarla.\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve) => rl.question('', resolve));
  rl.close();

  await driver.quit();
  console.log('Navegador cerrado.');
})();
