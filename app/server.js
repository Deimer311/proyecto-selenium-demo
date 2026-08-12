// Servidor estático mínimo (sin dependencias externas) para servir el demo
// que las pruebas de Selenium van a automatizar.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// La ruta /login sirve index.html (así coincide con driver.get(`${baseUrl}/login`))
const routes = {
  '/login': 'index.html',
  '/': 'index.html',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const fileName = routes[urlPath] || urlPath.replace(/^\//, '');
  const filePath = path.join(PUBLIC_DIR, fileName || 'index.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - No encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor demo corriendo en http://localhost:${PORT}`);
});
