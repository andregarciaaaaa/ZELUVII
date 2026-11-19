// Datas no fuso do condominio (America/Sao_Paulo).
// O Brasil nao tem horario de verao desde 2019, entao o deslocamento fixo -03:00 e seguro.
const TZ = 'America/Sao_Paulo';
const OFFSET = '-03:00';

const formatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

// { data: '2026-11-20', hora: '18:00', minutos: 1080 } no fuso local
function partesLocais(instante) {
  const p = Object.fromEntries(formatador.formatToParts(instante).map((x) => [x.type, x.value]));
  const hora = `${p.hour}:${p.minute}`;
  return { data: `${p.year}-${p.month}-${p.day}`, hora, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

function hhmmParaMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// '2026-11-20' + '18:00' -> Date (instante UTC correspondente)
function instanteLocal(dataStr, hhmm = '00:00') {
  return new Date(`${dataStr}T${hhmm}:00${OFFSET}`);
}

function hoje() {
  return partesLocais(new Date()).data;
}

function somarDias(dataStr, dias) {
  const d = instanteLocal(dataStr, '12:00');
  d.setUTCDate(d.getUTCDate() + dias);
  return partesLocais(d).data;
}

// '2026-11-20' -> '20/11/2026'
function dataBr(dataStr) {
  const [a, m, d] = dataStr.split('-');
  return `${d}/${m}/${a}`;
}

// Date (coluna DATE do Postgres, meia-noite UTC) -> 'YYYY-MM-DD'
function dataSql(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

module.exports = { TZ, OFFSET, partesLocais, hhmmParaMinutos, instanteLocal, hoje, somarDias, dataBr, dataSql };
