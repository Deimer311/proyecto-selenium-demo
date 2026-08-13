const { expect } = require('chai');
const http = require('http');
const readline = require('readline');
const { By } = require('selenium-webdriver');
const { crearDriver } = require('../../drivers/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const { esperarVisible, esperarUrlContiene } = require('../../utils/waits');
const config = require('../../config/environments');

// Corre en modo headless (CI) o en presentación en vivo.
const headless = process.env.HEADLESS === 'true';
const esCI = process.env.CI === 'true';

// Verifica que `npm start` ya esté corriendo antes de abrir Chrome. 
function servidorEstaArriba(baseUrl) {
  return new Promise((resolve) => {
    const req = http.get(`${baseUrl}/login`, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

describe('Inicio de sesión', function () {
  this.timeout(120000);
  let driver, loginPage;

  before(async () => {
    const arriba = await servidorEstaArriba(config.baseUrl);
    if (!arriba) {
      throw new Error(
        `No se pudo conectar a ${config.baseUrl}. ` +
          `¿Ya corriste "npm start" en otra terminal y la dejaste abierta?`
      );
    }

    driver = await crearDriver('chrome', headless);
    loginPage = new LoginPage(driver);
  });

  beforeEach(async () => {
    await driver.get(`${config.baseUrl}/login`);
    await driver.manage().deleteAllCookies();
    await driver.executeScript(
      'window.localStorage.clear(); window.sessionStorage.clear();'
    );
    await driver.navigate().refresh();
  });

  after(async function () {
    if (!driver) return;
    if (headless || esCI) {
      await driver.quit();
      return;
    }
    this.timeout(0);
    const urlActual = await driver.getCurrentUrl();
    if (!urlActual.includes('dashboard')) {
      await driver.get(`${config.baseUrl}/dashboard.html`);
    }

    console.log('\nSuite terminada. El navegador se quedó abierto en el Dashboard.');
    console.log('Presiona ENTER en esta terminal cuando quieras cerrarlo.\n');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise((resolve) => rl.question('', resolve));
    rl.close();

    await driver.quit();
  });

  // ===== BLOQUE 1: Pruebas previas en el formulario de Login =====

  it('debería mostrar error con credenciales inválidas', async () => {
    await loginPage.login('correo_falso@gmail.com', 'ClaveIncorrecta');
    await esperarVisible(driver, By.css('.error-message'));

    const mensaje = await loginPage.obtenerMensajeError();
    expect(mensaje).to.include('inválid');
  });

  it('no debería redirigir al dashboard con credenciales incorrectas', async () => {
    await loginPage.login('correo_falso@gmail.com', 'ClaveIncorrecta');
    await esperarVisible(driver, By.css('.error-message'));

    const dashboardPage = new DashboardPage(driver);
    const urlActual = await dashboardPage.obtenerUrlActual();
    expect(urlActual).to.not.include('dashboard');
  });


  

  // ===== BLOQUE 3: Cierre y navegación final =====

  it('debería acceder al dashboard con credenciales válidas', async () => {
    await loginPage.login('cliente@gmail.com', '123456');
    await esperarUrlContiene(driver, 'dashboard');

    const dashboardPage = new DashboardPage(driver);
    const titulo = await dashboardPage.obtenerTitulo();
    expect(titulo).to.include('Dashboard');
  });
});