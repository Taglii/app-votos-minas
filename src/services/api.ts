import { CANDIDATOS_FALLBACK } from '@/data/candidatosFallback';
import { FOTOS_LOCAIS } from '@/data/fotosCandidatos';
import { storageService } from '@/services/storage';
import { Candidato, Cargo, LadoPolitico } from '@/types/candidato';

// Configuração da API do Eleições.dev
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.eleicoes.dev';

const API_KEY =
  process.env.EXPO_PUBLIC_API_KEY ||
  'br_mixxoidiQhfzBUcRoOKDmxCkprMLQIjtNCurGjZnEmoxSyAWqFwGsiKjHVrNZUTx';

// Cache em memória para garantir respostas instantâneas ao navegar entre as abas
let cacheCandidatos: Candidato[] | null = null;
let cachePartidos: Record<string, string> | null = null;

const obterHeaders = (): Record<string, string> => ({
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
});

// Dicionário dos partidos brasileiros pelo número da legenda (2 primeiros dígitos do número do candidato)
// Garante identificação correta mesmo se o endpoint /parties estiver indisponível ou lento
const PARTIDOS_NUMERO: Record<string, string> = {
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

// Classifica o espectro político com base na sigla partidária
export const determinarLadoPolitico = (siglaOuNome: string): LadoPolitico => {
  const p = (siglaOuNome || '').toUpperCase().trim();

  if (['PT', 'PSOL', 'PC DO B', 'PCDOB', 'PSTU', 'PCO', 'UP'].some((s) => p.includes(s))) {
    return 'Esquerda';
  }
  if (['PSB', 'REDE', 'PDT', 'SOLIDARIEDADE'].some((s) => p.includes(s))) {
    return 'Centro-Esquerda';
  }
  if (['MDB', 'PSD', 'CIDADANIA', 'PSDB', 'PV', 'PMN', 'AGIR', 'MOBILIZA', 'AVANTE'].some((s) => p.includes(s))) {
    return 'Centro';
  }
  if (['UNIÃO', 'UNIAO', 'PODEMOS', 'PODE', 'PRD', 'PROGRESSISTAS', 'PP'].some((s) => p.includes(s))) {
    return 'Centro-Direita';
  }
  if (['PL', 'NOVO', 'REPUBLICANOS', 'DC', 'PRTB', 'PMB', 'MISSÃO', 'MISSAO'].some((s) => p.includes(s))) {
    return 'Direita';
  }
  return 'Centro';
};

// Mapeia o cargo retornado pela API para os tipos suportados no aplicativo
export const mapearCargo = (office?: string, officeLabel?: string): Cargo | null => {
  const off = (office || '').toLowerCase();
  const label = (officeLabel || '').toUpperCase();

  if (off === 'president' || label === 'PRESIDENTE') return 'Presidente';
  if (off === 'governor' || label === 'GOVERNADOR') return 'Governador';
  if (off === 'senator' || label === 'SENADOR') return 'Senador';
  if (off === 'federaldeputy' || label === 'DEPUTADO FEDERAL') return 'Deputado Federal';
  if (off === 'statedeputy' || label === 'DEPUTADO ESTADUAL') return 'Deputado Estadual';

  return null;
};

// Resolve a foto do candidato priorizando o arquivo local baixado do TSE
const resolverFoto = (tseId: string | undefined, urlApi: unknown, nome: string) => {
  const idLimpo = tseId ? String(tseId).trim() : '';

  // 1. Prioridade máxima: foto local mapeada pelo tseCandidateId
  if (idLimpo && FOTOS_LOCAIS[idLimpo]) {
    return FOTOS_LOCAIS[idLimpo];
  }

  // 2. Segunda opção: URL enviada pela API (caso exista)
  if (typeof urlApi === 'string' && urlApi.trim() !== '') {
    return urlApi.trim();
  }

  // 3. Fallback: avatar gerado com as iniciais do candidato
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    nome
  )}&background=C8102E&color=fff&size=256&format=png`;
};

// Aplica as fotos locais também sobre listas recuperadas do cache ou fallback
const vincularFotosLocaisNaLista = (lista: Candidato[]): Candidato[] =>
  lista.map((c) => {
    const idLimpo = c.tseId ? String(c.tseId).trim() : '';
    if (idLimpo && FOTOS_LOCAIS[idLimpo]) {
      return { ...c, foto: FOTOS_LOCAIS[idLimpo] };
    }
    return c;
  });

// Carrega o dicionário de partidos (id -> sigla) da API com timeout curto
const carregarMapaPartidos = async (): Promise<Record<string, string>> => {
  if (cachePartidos) return cachePartidos;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/parties`, {
      headers: obterHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Falha ao obter partidos: ${res.status}`);
    const json = await res.json();
    const mapa: Record<string, string> = {};

    if (Array.isArray(json?.data)) {
      json.data.forEach((p: any) => {
        if (p?.id) {
          mapa[p.id] = p.acronym || p.name || 'PARTIDO';
        }
      });
    }

    cachePartidos = mapa;
    return mapa;
  } catch {
    // Se o endpoint /parties falhar ou demorar, utiliza PARTIDOS_NUMERO
    return {};
  }
};

export const api = {
  // Retorna a chave de API configurada
  obterApiKey(): string {
    return API_KEY;
  },

  // Retorna a URL base configurada
  obterApiUrl(): string {
    return API_BASE;
  },

  // Busca e processa a lista de candidatos (Minas Gerais + Presidente)
  async getCandidatos(forcarFalha: boolean = false): Promise<Candidato[]> {
    if (forcarFalha) {
      throw new Error('Falha simulada na comunicação com a API do Eleições.dev.');
    }

    if (cacheCandidatos && cacheCandidatos.length > 0) {
      return [...cacheCandidatos];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      // Carrega os partidos e os candidatos em paralelo
      const [mapaPartidos, resposta] = await Promise.all([
        carregarMapaPartidos(),
        fetch(`${API_BASE}/candidates`, {
          headers: obterHeaders(),
          signal: controller.signal,
        }),
      ]);
      clearTimeout(timeoutId);

      if (!resposta.ok) {
        throw new Error(`Erro ${resposta.status} ao consultar API de candidatos.`);
      }

      const json = await resposta.json();
      const listaBruta: any[] = Array.isArray(json?.data) ? json.data : [];

      const listaTratada: Candidato[] = [];

      for (const item of listaBruta) {
        const cargo = mapearCargo(item.office, item.officeLabel);
        if (!cargo) continue; // ignora vices e suplentes na listagem de voto direto

        const ehPresidente = cargo === 'Presidente';
        const ehMinasGerais = item.state === 'MG' || item.electoralUnit === 'MG';

        // Filtra para o escopo solicitado: somente Minas Gerais + Presidente nacional
        if (!ehPresidente && !ehMinasGerais) continue;

        const numeroStr = String(item.number || '');
        const numeroPrefixo = numeroStr.padStart(2, '0').slice(0, 2);

        const siglaPartido =
          (item.partyId && mapaPartidos[item.partyId]) ||
          PARTIDOS_NUMERO[numeroPrefixo] ||
          item.federationName ||
          item.coalitionName ||
          'PARTIDO';

        const ladoPolitico = determinarLadoPolitico(siglaPartido);

        const statusResultado =
          item.result?.status ||
          (item.result?.outcome === 'elected'
            ? 'Eleito'
            : item.result?.outcome === 'alternate'
              ? 'Suplente'
              : item.result?.outcome === 'secondRound'
                ? '2º Turno'
                : item.candidacyStatus || 'Aguardando apuração');

        const eleito =
          item.result?.outcome === 'elected' ||
          String(statusResultado).toLowerCase().includes('eleito');

        const nome = item.ballotName || item.fullName || 'Candidato';
        const tseId = item.tseCandidateId ? String(item.tseCandidateId) : undefined;
        const fotoValida = resolverFoto(tseId, item.photoUrl, nome);

        const biografia = [
          item.occupation ? `Profissão: ${item.occupation}.` : null,
          item.education ? `Grau de instrução: ${item.education}.` : null,
          item.birthCity
            ? `Naturalidade: ${item.birthCity} (${item.birthState || 'MG'}).`
            : null,
          item.candidacyStatus ? `Situação no TSE: ${item.candidacyStatus}.` : null,
        ]
          .filter(Boolean)
          .join(' ') || 'Dados oficiais fornecidos pelo Tribunal Superior Eleitoral.';

        listaTratada.push({
          id: String(item.id),
          tseId,
          nome,
          nomeCompleto: item.fullName,
          numero: numeroStr,
          cargo,
          partido: siglaPartido,
          ladoPolitico,
          votos: typeof item.result?.votes === 'number' ? item.result.votes : 0,
          situacao: statusResultado,
          eleito,
          foto: fotoValida,
          viceOuSuplente: item.coalitionName || item.federationName,
          cidadeNatal: item.birthCity
            ? `${item.birthCity} (${item.birthState || 'MG'})`
            : undefined,
          ocupacao: item.occupation,
          escolaridade: item.education,
          patrimonioDeclarado: item.totalAssets,
          bensDeclarados: item.assetsDisclosed,
          cnpjCampanha: item.campaignCnpj,
          estado: item.state || (ehPresidente ? 'BR' : 'MG'),
          biografia,
        });
      }

      if (listaTratada.length > 0) {
        cacheCandidatos = listaTratada;
        await storageService.salvarCandidatosCache(listaTratada);
        return [...listaTratada];
      }

      throw new Error('Nenhum candidato de Minas Gerais encontrado na resposta da API.');
    } catch (erro) {
      console.warn('Falha ao consultar API online do Eleições.dev, buscando cache local:', erro);

      // Tenta recuperar do cache offline salvo no AsyncStorage e vincula as fotos locais
      const cacheOffline = await storageService.getCandidatosCache();
      if (cacheOffline && cacheOffline.length > 0) {
        const cacheComFotos = vincularFotosLocaisNaLista(cacheOffline);
        cacheCandidatos = cacheComFotos;
        return [...cacheComFotos];
      }

      // Se não houver cache offline anterior, usa a base seed oficial de fallback com as fotos locais
      const fallbackComFotos = vincularFotosLocaisNaLista(CANDIDATOS_FALLBACK);
      cacheCandidatos = fallbackComFotos;
      await storageService.salvarCandidatosCache(fallbackComFotos);
      return [...fallbackComFotos];
    }
  },

  // Busca detalhes de um candidato específico pelo id
  async getCandidatoById(id: string): Promise<Candidato> {
    const lista = await this.getCandidatos();
    const item = lista.find((c) => c.id === id);
    if (item) {
      return { ...item };
    }
    throw new Error('Candidato não encontrado nos registros de Minas Gerais.');
  },

  // Busca pelo número digitado na urna eletrônica
  async getCandidatoByNumero(numero: string, cargo?: Cargo): Promise<Candidato | null> {
    const lista = await this.getCandidatos();
    const matches = lista.filter((c) => {
      if (cargo) {
        return c.numero === numero && c.cargo === cargo;
      }
      return c.numero === numero;
    });

    if (matches.length === 0) return null;
    if (matches.length === 1) return { ...matches[0] };

    // Se houver mais de um registro para o mesmo número (ex: renúncia ou substituição de candidatura no TSE),
    // prioriza o candidato com situação deferida/eleito ou com maior votação apurada
    matches.sort((a, b) => {
      const aPrioritario =
        a.eleito ||
        a.situacao?.toLowerCase().includes('deferido') ||
        a.situacao?.toLowerCase().includes('eleito')
          ? 1
          : 0;
      const bPrioritario =
        b.eleito ||
        b.situacao?.toLowerCase().includes('deferido') ||
        b.situacao?.toLowerCase().includes('eleito')
          ? 1
          : 0;

      if (bPrioritario !== aPrioritario) return bPrioritario - aPrioritario;
      return (b.votos || 0) - (a.votos || 0);
    });

    return { ...matches[0] };
  },

  // Filtra candidatos por espectro político
  async getCandidatosByLado(lado: LadoPolitico): Promise<Candidato[]> {
    const lista = await this.getCandidatos();
    return lista.filter((c) => c.ladoPolitico === lado);
  },

  // Filtra candidatos por cargo
  async getCandidatosByCargo(cargo: Cargo): Promise<Candidato[]> {
    const lista = await this.getCandidatos();
    return lista.filter((c) => c.cargo === cargo);
  },

  // Limpa o cache em memória para forçar uma nova sincronização com a API
  limparCache(): void {
    cacheCandidatos = null;
    cachePartidos = null;
  },
};