const fs = require('fs');
const https = require('https');

const baixarJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let dados = '';
        res.on('data', (chunk) => (dados += chunk));
        res.on('end', () => resolve(JSON.parse(dados)));
      })
      .on('error', reject);
  });

async function enriquecerMapaMG() {
  console.log('Buscando lista de municípios de MG no IBGE...');
  const municipios = await baixarJson(
    'https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios'
  );

  // Cria mapa: codarea (ex: '3106200') -> nome (ex: 'Belo Horizonte')
  const mapaNomes = {};
  municipios.forEach((m) => {
    mapaNomes[String(m.id)] = m.nome;
  });

  const geoJson = JSON.parse(fs.readFileSync('./src/data/mgMunicipios.json', 'utf-8'));

  geoJson.features = geoJson.features.map((f) => {
    const cod = String(f.properties?.codarea || '');
    return {
      ...f,
      properties: {
        ...f.properties,
        nome: mapaNomes[cod] || '',
      },
    };
  });

  fs.writeFileSync('./src/data/mgMunicipios.json', JSON.stringify(geoJson), 'utf-8');
  console.log(`Pronto! ${geoJson.features.length} cidades atualizadas com nome em src/data/mgMunicipios.json`);
}

enriquecerMapaMG();