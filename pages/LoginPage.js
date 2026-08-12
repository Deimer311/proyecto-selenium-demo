// Page Object Model: encapsula localizadores y acciones de la página de login.
// Los archivos de prueba nunca deben incluir selectores directamente.
const { By, until } = require('selenium-webdriver');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.emailInput = By.css('#email');
    this.passwordInput = By.css('#password');
    this.loginButton = By.css('.login-btn');
    this.errorMessage = By.css('.error-message');
  }

  async login(correo, clave) {
    // Espera a que el campo de correo esté presente antes de tocarlo. Justo
    // después de driver.get() la navegación puede reportarse "completa" un
    // instante antes de que el DOM esté 100% listo para recibir clicks; este
    // wait evita ese margen de carrera sin agregar sleeps fijos.
    await this.driver.wait(until.elementLocated(this.emailInput), 10000);

    // clear() es indispensable si el login se intenta más de una vez en la
    // misma sesión de navegador: sendKeys() NO borra el valor anterior,
    // solo agrega texto al final.
    const campoCorreo = await this.driver.findElement(this.emailInput);
    await campoCorreo.clear();
    await campoCorreo.sendKeys(correo);

    const campoClave = await this.driver.findElement(this.passwordInput);
    await campoClave.clear();
    await campoClave.sendKeys(clave);

    // Se dispara el clic mediante JavaScript nativo (en vez de
    // WebElement.click()) porque el click "real" de Selenium depende de que
    // la ventana de Chrome tenga foco del sistema operativo; si la ventana
    // pierde el foco (otra app en primer plano, ejecución en CI, etc.) el
    // clic nunca llega al botón y la prueba se queda congelada esperando.
    // arguments[0].click() ejecuta el evento directamente sobre el DOM sin
    // pasar por el foco del SO, así que funciona igual con o sin
    // interacción humana en la ventana.
    const boton = await this.driver.findElement(this.loginButton);
    await this.driver.executeScript("arguments[0].click();", boton);
  }

  async obtenerMensajeError() {
    return await this.driver.findElement(this.errorMessage).getText();
  }

  async obtenerTipoCampoClave() {
    return await this.driver.findElement(this.passwordInput).getAttribute('type');
  }

  async elMensajeDeErrorEsVisible() {
    return await this.driver.findElement(this.errorMessage).isDisplayed();
  }
}

module.exports = LoginPage;