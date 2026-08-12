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

// Verifica que `npm start` ya esté corriendo antes de abrir Chrome. Sin esto,
// el error real (ERR_CONNECTION_REFUSED) aparece recién en el primer test y
// confunde: parece un fallo de Selenium cuando en realidad falta el server.
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
  // 2 minutos: da margen de sobra durante la exposición en vivo antes de
  // presionar ENTER en el after() (ver más abajo). Los tests individuales
  // siguen corriendo en segundos; este timeout solo evita que Mocha
  // considere "colgado" al hook after() mientras espera al usuario.
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

    // Un solo navegador para TODA la suite: se abre una vez aquí y se
    // reutiliza en todos los tests. Esto elimina el parpadeo de abrir y
    // cerrar Chrome en cada caso.
    driver = await crearDriver('chrome', headless);
    loginPage = new LoginPage(driver);
  });

  beforeEach(async () => {
    // 1) Navega a la página de login (recarga el formulario en la MISMA
    //    ventana, sin abrir/cerrar Chrome en cada test).
    await driver.get(`${config.baseUrl}/login`);

    // 2) Borra todas las cookies del navegador.
    await driver.manage().deleteAllCookies();

    // 3) Limpia localStorage y sessionStorage. Se ejecuta después de
    //    driver.get() porque necesita una página cargada (con el dominio
    //    correcto) para poder acceder a esos storages.
    await driver.executeScript(
      'window.localStorage.clear(); window.sessionStorage.clear();'
    );

    // Como la limpieza de storage puede haber alterado el estado visual de
    // la página (por ejemplo, si la app lee la sesión al cargar), se
    // recarga una vez más para que cada test arranque desde un estado
    // 100% limpio y predecible.
    await driver.navigate().refresh();
  });

  after(async function () {
    if (!driver) return;

    // En CI / headless no hay nadie mirando la pantalla: cerrar de una vez,
    // sin pausa interactiva (readline se quedaría esperando un ENTER que
    // nunca llega en un pipeline automatizado).
    if (headless || esCI) {
      await driver.quit();
      return;
    }

    // En vivo: dejar el navegador quieto en el Dashboard hasta que la
    // persona presente decida cerrarlo, en vez de que Selenium lo cierre
    // automáticamente apenas terminan las pruebas.
    this.timeout(0); // sin límite: puede esperar lo que haga falta

    // El último test ('debería acceder al dashboard...') ya deja al
    // navegador en el Dashboard mediante un login real. Este chequeo es
    // solo un respaldo: si por algún motivo no terminó ahí, lo manda
    // directo por URL para garantizar que la pantalla final sea el
    // Dashboard.
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
  // Último test de la suite a propósito: deja el navegador en el Dashboard
  // por un login real (no por un salto de URL), y como es el último, el
  // beforeEach no vuelve a mandarlo al login después de este punto.

  it('debería acceder al dashboard con credenciales válidas', async () => {
    await loginPage.login('cliente@gmail.com', '123456');
    await esperarUrlContiene(driver, 'dashboard');

    const dashboardPage = new DashboardPage(driver);
    const titulo = await dashboardPage.obtenerTitulo();
    expect(titulo).to.include('Dashboard');
  });
});