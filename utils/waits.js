// Esperas explícitas reutilizables. Evita usar sleep() fijo: vuelve las
// pruebas lentas e inestables. Estas esperas reaccionan al estado real de la página.
const { until } = require('selenium-webdriver');

// 10s en vez de 5s: en la demo real (Chrome con extensiones, laptop bajo carga
// durante la presentación) 5s a veces se quedaba corto por un margen mínimo
// (~150-200ms), lo que causaba fallos intermitentes sin que hubiera ningún
// bug real en la app. 10s da colchón de sobra sin volver las pruebas lentas,
// porque solo se espera lo que tarde realmente: si el elemento aparece en
// 300ms, el test sigue en 300ms.
const TIMEOUT_POR_DEFECTO = 10000;

async function esperarVisible(driver, localizador, timeoutMs = TIMEOUT_POR_DEFECTO) {
  const elemento = await driver.wait(until.elementLocated(localizador), timeoutMs);
  await driver.wait(until.elementIsVisible(elemento), timeoutMs);
  return elemento;
}

async function esperarUrlContiene(driver, fragmento, timeoutMs = TIMEOUT_POR_DEFECTO) {
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes(fragmento);
  }, timeoutMs);
}

module.exports = { esperarVisible, esperarUrlContiene };
