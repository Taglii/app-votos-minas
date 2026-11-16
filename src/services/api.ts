import { Candidato, Cargo, LadoPolitico } from '@/types/candidato';

const GIST_API_URL =
  'https://gist.githubusercontent.com/Taglii/d6be1c0afc6b2ea936c427ca4e9e6a7b/raw/71e3acb421a8fd2f77c6c6f2692805f9289538dd/candidatos-vazio.json';

// Cache em memória para não precisar baixar o json de 785 itens toda vez
let cacheCandidatos: Candidato[] | null = null;

export const api = {
  // Busca lista de candidatos exclusivamente da API do Gist
  async getCandidatos(forcarFalha: boolean = false): Promise<Candidato[]> {
    if (forcarFalha) {
      throw new Error('Falha simulada na comunicação com a API do Gist.');
    }

    if (cacheCandidatos && cacheCandidatos.length > 0) {
      return [...cacheCandidatos];
    }

    try {
      const response = await fetch(GIST_API_URL);
      if (!response.ok) {
        throw new Error(`Erro HTTP ao buscar API: ${response.status}`);
      }
      const data: Candidato[] = await response.json();
      cacheCandidatos = data;
      return [...data];
    } catch (error) {
      console.error('Erro ao carregar candidatos da API:', error);
      throw new Error('Não foi possível conectar à API de candidatos. Verifique sua conexão.');
    }
  },

  // Busca detalhes de um candidato pelo id
  async getCandidatoById(id: string): Promise<Candidato> {
    const lista = await this.getCandidatos();
    const item = lista.find((c) => c.id === id);
    if (item) {
      return { ...item };
    }
    throw new Error('Candidato não encontrado nos registros da API.');
  },

  // Busca pelo número digitado na urna
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

  async getCandidatosByLado(lado: LadoPolitico): Promise<Candidato[]> {
    const lista = await this.getCandidatos();
    return lista.filter((c) => c.ladoPolitico === lado);
  },

  async getCandidatosByCargo(cargo: Cargo): Promise<Candidato[]> {
    const lista = await this.getCandidatos();
    return lista.filter((c) => c.cargo === cargo);
  },

  // Permite forçar recarregamento do Gist limpando o cache
  limparCache(): void {
    cacheCandidatos = null;
  },
};
