// Page Object del Dashboard, al que se llega tras un login exitoso.
class DashboardPage {
  constructor(driver) {
    this.driver = driver;
  }

  async obtenerTitulo() {
    return await this.driver.getTitle();
  }

  async obtenerUrlActual() {
    return await this.driver.getCurrentUrl();
  }
}

module.exports = DashboardPage;
