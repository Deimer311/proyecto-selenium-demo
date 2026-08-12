// Centraliza la creación de instancias del navegador.
// Cambiar de navegador o activar headless es una sola línea, no un cambio en cada test.
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function crearDriver(navegador = 'chrome', headless = false) {
  if (navegador === 'chrome') {
    const options = new chrome.Options();
    options.addArguments('--log-level=3');

    // Apaga features internas de Chrome (modelos on-device de traducción,
    // "optimization guide", etc. — las que imprimen logs como "TensorFlow
    // Lite XNNPACK delegate") que consumen CPU en segundo plano y pueden
    // volver más lentas/erráticas las respuestas durante las pruebas.
    options.addArguments(
      '--disable-features=OptimizationGuideModelDownloading,OptimizationHintsFetching,OptimizationTargetPrediction,OptimizationHints,Translate'
    );
    options.addArguments('--disable-background-networking');
    options.excludeSwitches('enable-automation');

    if (headless) {
      options.addArguments('--headless=new');
      options.addArguments('--window-size=1280,800');
    } else {
      // Misma posición y tamaño en cada test: evita que la ventana
      // "salte" por la pantalla cada vez que un test abre un nuevo navegador.
      options.addArguments('--window-size=1000,700');
      options.addArguments('--window-position=100,50');
    }

    return await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  // Agrega más navegadores aquí si el equipo lo necesita (firefox, edge...)
  return await new Builder().forBrowser(navegador).build();
}

module.exports = { crearDriver };
