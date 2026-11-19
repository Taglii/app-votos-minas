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

// Cabeçalhos de autenticação para a api.eleicoes.dev
const obterHeaders = (): Record<string, string> => ({
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'x-api-key': API_KEY,
});

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
  if (['UNIÃO', 'UNIAO', 'PODEMOS', 'PRD', 'PROGRESSISTAS', 'PP'].some((s) => p.includes(s))) {
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

// Carrega o dicionário de partidos (id -> sigla) da API
const carregarMapaPartidos = async (): Promise<Record<string, string>> => {
  if (cachePartidos) return cachePartidos;

  try {
    const res = await fetch(`${API_BASE}/parties`, { headers: obterHeaders() });
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
  } catch (erro) {
    console.warn('Não foi possível carregar a lista de partidos da API, usando dados locais:', erro);
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
      // Carrega os partidos e os candidatos em paralelo
      const [mapaPartidos, resposta] = await Promise.all([
        carregarMapaPartidos(),
        fetch(`${API_BASE}/candidates`, { headers: obterHeaders() }),
      ]);

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

        const siglaPartido =
          (item.partyId && mapaPartidos[item.partyId]) ||
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
        const fotoFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          nome
        )}&background=C8102E&color=fff&size=256&format=png`;

        // O TSE serve as fotos com header content-disposition: attachment,
        // o que impede o <Image> do React Native de renderizar.
        // Usamos o proxy wsrv.nl para remover esse header e servir a imagem corretamente.
        const resolverFoto = (photoUrl?: string): string => {
          if (!photoUrl) return fotoFallback;
          if (photoUrl.includes('divulgacandcontas.tse.jus.br')) {
            return `https://wsrv.nl/?url=${encodeURIComponent(photoUrl)}&output=jpg&w=256&h=256&fit=cover`;
          }
          return photoUrl;
        };

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
          tseId: item.tseCandidateId ? String(item.tseCandidateId) : undefined,
          nome,
          nomeCompleto: item.fullName,
          numero: String(item.number),
          cargo,
          partido: siglaPartido,
          ladoPolitico,
          votos: typeof item.result?.votes === 'number' ? item.result.votes : 0,
          situacao: statusResultado,
          eleito,
          foto: resolverFoto(item.photoUrl),
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

      cacheCandidatos = listaTratada;
      return [...listaTratada];
    } catch (erro) {
      console.error('Erro ao buscar dados na API do Eleições.dev:', erro);
      throw new Error(
        'Não foi possível conectar à API de eleições. Verifique sua conexão à internet.'
      );
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
    const match = lista.find((c) => {
      if (cargo) {
        return c.numero === numero && c.cargo === cargo;
      }
      return c.numero === numero;
    });
    return match ? { ...match } : null;
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
