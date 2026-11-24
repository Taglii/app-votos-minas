/**
 * Testes Automatizados de Auditoria do Projeto Voto Minas
 */

// Função idêntica à de CandidateImage.tsx para teste unitário
const extrairIniciais = (nome) => {
  if (!nome || typeof nome !== 'string') return 'C';
  const limpo = nome
    .trim()
    .toUpperCase()
    .replace(/^(DR\.|DRA\.|PROF\.|PROFA\.|DEPUTADO FEDERAL|DEPUTADA FEDERAL|DEPUTADO ESTADUAL|DEPUTADA ESTADUAL|DEPUTADO|DEPUTADA|CORONEL|PASTOR|PASTORA|PADRE|SARGENTO)\s+/i, '')
    .trim();

  const partes = limpo.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'C';
  if (partes.length === 1) {
    return partes[0].slice(0, 2);
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

// Dicionário de partidos
const PARTIDOS_NUMERO = {
  '10': 'REPUBLICANOS',
  '11': 'PP',
  '12': 'PDT',
  '13': 'PT',
  '14': 'PTB',
  '15': 'MDB',
  '16': 'PSTU',
  '18': 'REDE',
  '19': 'PODE',
  '20': 'PSC',
  '21': 'PCB',
  '22': 'PL',
  '23': 'CIDADANIA',
  '25': 'PRD',
  '27': 'DC',
  '28': 'PRTB',
  '29': 'PCO',
  '30': 'NOVO',
  '33': 'MOBILIZA',
  '35': 'PMB',
  '36': 'AGIR',
  '40': 'PSB',
  '43': 'PV',
  '44': 'UNIÃO',
  '45': 'PSDB',
  '50': 'PSOL',
  '51': 'PATRIOTA',
  '55': 'PSD',
  '65': 'PCdoB',
  '70': 'AVANTE',
  '77': 'SOLIDARIEDADE',
  '80': 'UP',
};

function determinarLadoPolitico(siglaOuNome) {
  const p = (siglaOuNome || '').toUpperCase().trim();
  if (['PT', 'PSOL', 'PC DO B', 'PCDOB', 'PSTU', 'PCO', 'UP'].some((s) => p.includes(s))) return 'Esquerda';
  if (['PSB', 'REDE', 'PDT', 'SOLIDARIEDADE'].some((s) => p.includes(s))) return 'Centro-Esquerda';
  if (['MDB', 'PSD', 'CIDADANIA', 'PSDB', 'PV', 'PMN', 'AGIR', 'MOBILIZA', 'AVANTE'].some((s) => p.includes(s))) return 'Centro';
  if (['UNIÃO', 'UNIAO', 'PODEMOS', 'PODE', 'PRD', 'PROGRESSISTAS', 'PP'].some((s) => p.includes(s))) return 'Centro-Direita';
  if (['PL', 'NOVO', 'REPUBLICANOS', 'DC', 'PRTB', 'PMB', 'MISSÃO', 'MISSAO'].some((s) => p.includes(s))) return 'Direita';
  return 'Centro';
}

function mapearCargo(office, officeLabel) {
  const off = (office || '').toLowerCase();
  const label = (officeLabel || '').toUpperCase();
  if (off === 'president' || label === 'PRESIDENTE') return 'Presidente';
  if (off === 'governor' || label === 'GOVERNADOR') return 'Governador';
  if (off === 'senator' || label === 'SENADOR') return 'Senador';
  if (off === 'federaldeputy' || label === 'DEPUTADO FEDERAL') return 'Deputado Federal';
  if (off === 'statedeputy' || label === 'DEPUTADO ESTADUAL') return 'Deputado Estadual';
  return null;
}

async function executarTestes() {
  console.log('========================================================');
  console.log('🗳️  INICIANDO SUÍTE DE TESTES DE AUDITORIA - VOTO MINAS');
  console.log('========================================================\n');

  let totalTestes = 0;
  let sucessos = 0;
  let falhas = 0;

  function assert(condicao, nome) {
    totalTestes++;
    if (condicao) {
      console.log(`  ✅ [PASS] ${nome}`);
      sucessos++;
    } else {
      console.error(`  ❌ [FAIL] ${nome}`);
      falhas++;
    }
  }

  // ----------------------------------------------------
  // TESTE 1: Fallback e Iniciais de Candidatos
  // ----------------------------------------------------
  console.log('--- TESTE 1: Geração de Iniciais e Fallback de Fotografias ---');
  assert(extrairIniciais('Lula') === 'LU', 'Iniciais para "Lula" deve ser "LU"');
  assert(extrairIniciais('Romeu Zema') === 'RZ', 'Iniciais para "Romeu Zema" deve ser "RZ"');
  assert(extrairIniciais('Cleitinho Azevedo') === 'CA', 'Iniciais para "Cleitinho Azevedo" deve ser "CA"');
  assert(extrairIniciais('Dra. Georgia Micheletti') === 'GM', 'Iniciais ignorando prefixo "Dra." deve ser "GM"');
  assert(extrairIniciais('Deputado Federal Reginaldo Lopes') === 'RL', 'Iniciais ignorando título "Deputado Federal" deve ser "RL"');
  assert(extrairIniciais('') === 'C', 'Iniciais para string vazia deve ser "C"');

  // ----------------------------------------------------
  // TESTE 2: Mapeamento de Espectro Político
  // ----------------------------------------------------
  console.log('\n--- TESTE 2: Mapeamento de Espectro Político ---');
  assert(determinarLadoPolitico('PT') === 'Esquerda', 'PT deve ser classificado como Esquerda');
  assert(determinarLadoPolitico('PL') === 'Direita', 'PL deve ser classificado como Direita');
  assert(determinarLadoPolitico('NOVO') === 'Direita', 'NOVO deve ser classificado como Direita');
  assert(determinarLadoPolitico('PSD') === 'Centro', 'PSD deve ser classificado como Centro');
  assert(determinarLadoPolitico('PDT') === 'Centro-Esquerda', 'PDT deve ser classificado como Centro-Esquerda');
  assert(determinarLadoPolitico('UNIÃO') === 'Centro-Direita', 'UNIÃO deve ser classificado como Centro-Direita');

  // ----------------------------------------------------
  // TESTE 3: Regras Eleitorais de Dígitos por Cargo (Urna)
  // ----------------------------------------------------
  console.log('\n--- TESTE 3: Regras Eleitorais da Urna (TSE) ---');
  assert(mapearCargo('president') === 'Presidente', 'president mapeia para Presidente');
  assert(mapearCargo('governor') === 'Governador', 'governor mapeia para Governador');
  assert(mapearCargo('senator') === 'Senador', 'senator mapeia para Senador');
  assert(mapearCargo('federaldeputy') === 'Deputado Federal', 'federaldeputy mapeia para Deputado Federal');
  assert(mapearCargo('statedeputy') === 'Deputado Estadual', 'statedeputy mapeia para Deputado Estadual');

  // ----------------------------------------------------
  // TESTE 4: Conexão e Integridade da API Eleições.dev
  // ----------------------------------------------------
  console.log('\n--- TESTE 4: Conexão e Dados da API Online ---');
  const API_BASE = 'https://api.eleicoes.dev';
  const API_KEY = 'br_mixxoidiQhfzBUcRoOKDmxCkprMLQIjtNCurGjZnEmoxSyAWqFwGsiKjHVrNZUTx';

  try {
    const res = await fetch(`${API_BASE}/candidates`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    assert(res.status === 200, `API Eleições.dev respondeu com status 200 OK (atual: ${res.status})`);
    
    const json = await res.json();
    assert(Array.isArray(json?.data) && json.data.length > 0, `API retornou array de dados com ${json?.data?.length} candidatos`);

    const mgCandidates = json.data.filter(c => {
      const cargo = mapearCargo(c.office, c.officeLabel);
      if (!cargo) return false;
      const ehPres = cargo === 'Presidente';
      const ehMG = c.state === 'MG' || c.electoralUnit === 'MG';
      return ehPres || ehMG;
    });

    assert(mgCandidates.length > 1000, `Identificados ${mgCandidates.length} candidatos no escopo de Minas Gerais e Presidência`);

    // ----------------------------------------------------
    // TESTE 5: Acesso Direto às Fotografias Oficiais no TSE
    // ----------------------------------------------------
    console.log('\n--- TESTE 5: Acessibilidade das Fotografias Oficiais no TSE ---');
    const amostraFoto = mgCandidates.find(c => c.photoUrl && c.photoUrl.includes('divulgacandcontas.tse.jus.br'));
    
    if (amostraFoto) {
      console.log(`  🔎 Testando URL do TSE: ${amostraFoto.photoUrl} (${amostraFoto.ballotName})`);
      const resFoto = await fetch(amostraFoto.photoUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      assert(resFoto.status === 200, `Foto oficial do candidato no TSE acessível com HTTP 200 OK`);
      const contentType = resFoto.headers.get('content-type');
      assert(contentType && contentType.startsWith('image/'), `Content-Type da foto é de imagem válido: ${contentType}`);
    } else {
      console.log('  ⚠️ Nenhuma foto com URL do TSE encontrada na amostra');
    }

  } catch (err) {
    console.warn('  ⚠️ Aviso de rede na execução do teste online:', err.message);
  }

  // ----------------------------------------------------
  // RELATÓRIO FINAL DA SUÍTE
  // ----------------------------------------------------
  console.log('\n========================================================');
  console.log(`📊 RESULTADO DA SUÍTE: ${sucessos} / ${totalTestes} testes aprovados.`);
  if (falhas === 0) {
    console.log('🎉 TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO!');
  } else {
    console.error(`⚠️ ${falhas} teste(s) falharam.`);
  }
  console.log('========================================================\n');

  return falhas === 0;
}

executarTestes().then((passou) => {
  if (!passou) process.exit(1);
});
