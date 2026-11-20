// Monta o Express: middlewares globais, rotas da API, front-end estatico e tratamento de erros
const path = require('path');
const express = require('express');
const cors = require('cors');
const { corsOrigin } = require('./config/env');
const rotas = require('./routes');
const tratarErros = require('./middlewares/tratarErros');

const app = express();

app.use(cors(corsOrigin.length ? { origin: corsOrigin } : undefined));
app.use(express.json({ limit: '100kb' }));

app.use('/api/v1', rotas);

// Serve o front-end (pasta src/ na raiz do repositorio) em http://localhost:3333
// Assim front e API rodam com um unico comando, na mesma origem.
app.use(express.static(path.join(__dirname, '..', '..', 'src')));

app.use(tratarErros);

module.exports = app;
