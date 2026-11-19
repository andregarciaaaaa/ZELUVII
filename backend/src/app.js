const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const tratarErros = require('./middlewares/tratarErros');

const app = express();
app.disable('x-powered-by');

// O front (src/) usa React/Babel por CDN e estilos inline: a CSP padrao do helmet o bloquearia.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const ehLocalhost = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
app.use(cors({
  origin(origem, cb) {
    if (!origem) return cb(null, true); // curl, Postman, mesma origem
    if (env.corsOrigens.includes(origem) || (!env.producao && ehLocalhost(origem))) return cb(null, true);
    return cb(null, false);
  },
}));

app.use(express.json({ limit: '100kb' }));
app.use('/api/v1', routes);

// Em desenvolvimento a mesma porta tambem serve o front (pasta src/ da raiz do repositorio).
const pastaFront = path.resolve(__dirname, '..', '..', 'src');
if (fs.existsSync(path.join(pastaFront, 'index.html'))) {
  app.use(express.static(pastaFront));
  // Link do e-mail de recuperacao/convite: a tela de redefinicao e uma rota do proprio front
  app.get("/redefinir-senha", (req, res) => res.sendFile(path.join(pastaFront, "index.html")));
}

app.use(tratarErros.rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
