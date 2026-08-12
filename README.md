# Proyecto Demo — Pruebas Automatizadas con Selenium WebDriver

Proyecto base para la exposición de **Parte 3: Estructuración de un Proyecto Grande y Escalable**. Incluye una mini-aplicación de login (para no depender de ningún backend externo) y una suite de pruebas de Selenium completamente funcional sobre ella.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) instalado (v18 o superior)
- Google Chrome instalado en la máquina

---

## 1. Clonar e instalar

```bash
git clone <URL-DE-ESTE-REPOSITORIO>
cd proyecto-selenium-demo
npm install
```

## 2. Levantar la app demo

En una terminal:

```bash
npm start
```

Verás:
```
Servidor demo corriendo en http://localhost:9999
```

Déjala corriendo — no cierres esta terminal.

## 3. Correr las pruebas de Selenium

En **otra terminal** (con el servidor del paso 2 aún corriendo):

```bash
npm test
```

Vas a ver Chrome abrirse **una sola vez** (no una vez por test), navegar entre los 7 casos dentro de la misma ventana, y en la terminal el resultado de cada uno.

Para correrlas en modo headless (sin ventana visible, como en CI/CD):

```bash
npm run test:headless
```

## 4. Mostrar la app en vivo sin que se cierre sola

Con el servidor del paso 2 aún corriendo, en otra terminal:

```bash
npm run demo
```

Esto abre **un solo navegador** (sin abrir y cerrar ventanas de más) y hace lo siguiente en orden, mostrando cada paso en la terminal:

1. Intenta login con credenciales incorrectas → muestra el error
2. Corrige las credenciales → entra correctamente
3. Se queda **quieto en la página de bienvenida** — la terminal te pedirá presionar ENTER cuando quieras cerrarlo

Así puedes explicar tanto el comportamiento de las pruebas como la interfaz final, con calma, frente a tus compañeros.

## 5. Ver el reporte visual en HTML

Cada vez que corres `npm test`, además de lo que ves en consola, se genera automáticamente un reporte HTML navegable en:

```
mochawesome-report/reporte-pruebas.html
```

Ábrelo con doble clic (o arrástralo a Chrome). Vas a ver un dashboard con: cuántas pruebas pasaron/fallaron, el tiempo que tomó cada una, y el detalle expandible de cada caso — muy similar al reporte HTML de Playwright que viste al inicio, pero generado para Selenium.

---

## Estructura del proyecto

```
proyecto-selenium-demo/
├── app/                    # App demo (login + dashboard) para tener algo real que probar
│   ├── index.html
│   ├── dashboard.html
│   └── server.js
├── demo/
│   └── mostrar-app.js       # Script para mostrar la app en vivo (navegador queda abierto)
├── config/
│   └── environments.js     # URLs por ambiente (dev, staging, prod)
├── drivers/
│   └── driverFactory.js    # Centraliza la creación del driver del navegador
├── pages/
│   ├── LoginPage.js        # Page Object Model: login
│   └── DashboardPage.js    # Page Object Model: dashboard
├── tests/
│   └── auth/
│       └── login.test.js   # Casos de prueba (Mocha + Chai)
├── utils/
│   └── waits.js             # Esperas explícitas reutilizables
├── mochawesome-report/       # (se genera solo al correr npm test) Reporte HTML
├── .mocharc.json             # Configuración del test runner
├── mocha-multi-reporters.config.json  # Configura consola + HTML a la vez
└── .github/workflows/
    └── tests.yml            # Pipeline de CI/CD (GitHub Actions)
```

Cada carpeta tiene una sola responsabilidad — así es como se mantiene ordenado un proyecto de automatización cuando crece a decenas o cientos de pruebas.

---

## Guion para la exposición (paso a paso)

1. **Mostrar la app corriendo** (`npm start`) — que el grupo vea qué se va a automatizar: un login con caso de error y caso de éxito.
2. **`config/environments.js`** — explicar que la URL nunca se hardcodea en los tests, así se puede correr contra dev/staging/prod cambiando una variable.
3. **`drivers/driverFactory.js`** — explicar que centralizar la creación del navegador permite activar headless o cambiar de navegador sin tocar los tests.
4. **`before`/`beforeEach`/`after` en `login.test.js`** — explicar que el navegador se abre **una sola vez** para toda la suite (`before`), y cada test solo recarga la página de login dentro de la misma ventana (`beforeEach`). Esto evita el parpadeo de abrir/cerrar Chrome en cada caso, sin perder que cada test arranque con el formulario limpio.
5. **`pages/LoginPage.js`** — explicar el Page Object Model: los selectores viven en un solo lugar, si la UI cambia, se arregla en un archivo, no en 30 tests. Mostrar el método `login()` y explicar por qué usa `clear()` antes de escribir (sendKeys() NO borra el valor anterior, solo agrega texto).
6. **`utils/waits.js`** — explicar por qué NO se usa `sleep()` fijo, y cómo una espera explícita reacciona al estado real de la página.
7. **`tests/auth/login.test.js`** — correr en vivo (`npm test`) y recorrer los 7 casos, cada uno enseña un concepto distinto (ver tabla abajo).
8. **`npm run demo`** — cierre visual de la exposición: muestra el mismo escenario (login fallido → login correcto) narrado en consola, y deja el navegador quieto en la página de bienvenida para explicarla con calma.
9. **Reporte HTML** — abrir `mochawesome-report/reporte-pruebas.html` (generado tras `npm test`) y mostrarlo en el proyector.
10. **`.github/workflows/tests.yml`** — explicar que esto corre automáticamente en cada push a GitHub, sin que nadie tenga que ejecutar nada manualmente.

### Los 7 casos de prueba y qué enseña cada uno

| # | Test | Concepto que enseña |
|---|---|---|
| 1 | Muestra error con credenciales inválidas | Verificación básica de un mensaje de texto |
| 2 | Accede al dashboard con credenciales válidas | Flujo de éxito + navegación entre páginas |
| 3 | No debería redirigir con credenciales incorrectas | Aserción negativa (confirmar que algo NO pasó) |
| 4 | Muestra error si el correo está vacío | Cómo un test puede exponer un comportamiento real de la app |
| 5 | Permite corregir credenciales tras un fallo | Reutilizar el mismo navegador para una segunda acción (y por qué `clear()` es necesario) |
| 6 | El campo de contraseña oculta el texto (type="password") | Leer un **atributo** HTML (`getAttribute`), no solo texto visible — conecta con seguridad real |
| 7 | El mensaje de error no es visible al cargar la página | `isDisplayed()`: distingue que un elemento *exista* en el HTML de que se *vea* en pantalla |

---

## Notas técnicas importantes (por si alguien pregunta)

- **Chai está fijado en la versión 4** (`chai@4.5.0`) a propósito: la versión 5 es ESM puro y no funciona con `require()`. Si alguien instala `chai` sin especificar versión, el proyecto se rompe.
- **No hay dependencia de `chromedriver`/`geckodriver` como paquetes npm.** Se apoya en **Selenium Manager**, integrado en `selenium-webdriver` 4.6+, que detecta la versión de Chrome/Firefox instalada y descarga el driver correcto automáticamente. Esto evita fallos de instalación como `getaddrinfo ENOTFOUND googlechromelabs.github.io`, que ocurren cuando una red bloquea ese dominio específico.
- **El modo headless se lee de `process.env.HEADLESS`** dentro de `login.test.js`, y se activa con la librería `cross-env` para que `npm run test:headless` funcione igual en Windows, Mac y Linux.
- La app demo (`app/`) es un HTML+JS simple sin backend real, hecha solo para que el proyecto sea 100% autocontenido y cualquiera pueda clonarlo y correrlo sin configurar nada extra.

---

## Cómo lo usarían tus compañeros para practicar

1. Clonan el repo
2. Corren `npm install`, `npm start`, `npm test`
3. Abren `tests/auth/login.test.js` y agregan un tercer `it(...)` de su propia autoría (ej. "debería mostrar error si el campo de correo está vacío")
4. Corren `npm test` de nuevo para ver su prueba nueva pasar
