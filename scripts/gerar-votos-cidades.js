const fs = require('fs');
const readline = require('readline');

// Ajuste o nome do arquivo caso o ano/nome do CSV baixado seja diferente
const ARQUIVO_CSV = './scripts/votacao_candidato_munzona_2026_MG.csv';
const ARQUIVO_SAIDA = './src/data/votosPorCidadeMG.json';

// Normaliza o nome da cidade para cruzar facilmente com o GeoJSON do IBGE
const normalizarNome = (texto) =>
  (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

async function processarCSV() {
  if (!fs.existsSync(ARQUIVO_CSV)) {
    console.error(`Arquivo não encontrado em: ${ARQUIVO_CSV}`);
    process.exit(1);
  }

  // O TSE salva CSVs em latin1 separados por ponto e vírgula (;)
  const stream = fs.createReadStream(ARQUIVO_CSV, { encoding: 'latin1' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let cabecalho = [];
  let idx = {};
  const cidades = {};

  for await (const linha of rl) {
    const colunas = linha.split(';').map((c) => c.replace(/^"|"$/g, '').trim());

    if (cabecalho.length === 0) {
      cabecalho = colunas;
      idx = {
        turno: cabecalho.indexOf('NR_TURNO'),
        uf: cabecalho.indexOf('SG_UF'),
        municipio: cabecalho.indexOf('NM_MUNICIPIO'),
        cargo: cabecalho.indexOf('DS_CARGO'),
        numero: cabecalho.indexOf('NR_CANDIDATO'),
        nomeUrna: cabecalho.indexOf('NM_URNA_CANDIDATO'),
        partido: cabecalho.indexOf('SG_PARTIDO'),
        votos: cabecalho.indexOf('QT_VOTOS_NOMINAIS'),
        votosValidos: cabecalho.indexOf('QT_VOTOS_NOMINAIS_VALIDOS'),
      };
      continue;
    }

    // Filtra apenas 1º turno e estado de MG
    if (colunas[idx.turno] !== '1' || colunas[idx.uf] !== 'MG') continue;

    const cargoBruto = (colunas[idx.cargo] || '').toUpperCase();
    let chaveCargo = null;
    if (cargoBruto === 'PRESIDENTE') chaveCargo = 'presidente';
    else if (cargoBruto === 'GOVERNADOR') chaveCargo = 'governador';
    else if (cargoBruto === 'SENADOR') chaveCargo = 'senador';
    else continue; // Ignora deputados para manter o JSON leve (~120 KB)

    const nomeCidadeOriginal = colunas[idx.municipio];
    const chaveCidade = normalizarNome(nomeCidadeOriginal);
    const numero = colunas[idx.numero];
    const colVotos = idx.votosValidos !== -1 ? idx.votosValidos : idx.votos;
    const votos = parseInt(colunas[colVotos] || '0', 10);

    if (!cidades[chaveCidade]) {
      cidades[chaveCidade] = {
        nome: nomeCidadeOriginal,
        presidente: {},
        governador: {},
        senador: {},
      };
    }

    if (!cidades[chaveCidade][chaveCargo][numero]) {
      cidades[chaveCidade][chaveCargo][numero] = {
        numero,
        nome: colunas[idx.nomeUrna],
        partido: colunas[idx.partido],
        votos: 0,
      };
    }

    // Soma os votos de todas as zonas eleitorais daquele município
    cidades[chaveCidade][chaveCargo][numero].votos += votos;
  }

  // Ordena para deixar o top 3 mais votados de cada cargo em cada cidade
  const resultadoFinal = {};
  for (const [chaveCidade, dados] of Object.entries(cidades)) {
    resultadoFinal[chaveCidade] = {
      nome: dados.nome,
      presidente: Object.values(dados.presidente)
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 3),
      governador: Object.values(dados.governador)
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 3),
      senador: Object.values(dados.senador)
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 3),
    };
  }

  if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data', { recursive: true });
  }

  fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(resultadoFinal, null, 2), 'utf-8');
  console.log(
    `Sucesso! ${Object.keys(resultadoFinal).length} municípios de MG salvos em ${ARQUIVO_SAIDA}`
  );
}

processarCSV();