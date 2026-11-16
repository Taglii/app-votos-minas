import { CANDIDATOS_MOCK } from '@/data/candidatosMock';
import { Candidato, Cargo, LadoPolitico } from '@/types/candidato';

// Simula o tempo de resposta de uma chamada de rede
const TEMPO_RESPOSTA_MS = 600;

export const api = {
  // Retorna todos os candidatos com delay simulado
  async getCandidatos(forcarFalha: boolean = false): Promise<Candidato[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (forcarFalha) {
          reject(new Error('Não foi possível conectar ao servidor. Verifique sua internet.'));
          return;
        }
        resolve([...CANDIDATOS_MOCK]);
      }, TEMPO_RESPOSTA_MS);
    });
  },

  // Busca detalhes de um candidato pelo id
  async getCandidatoById(id: string): Promise<Candidato> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const item = CANDIDATOS_MOCK.find((c) => c.id === id);
        if (item) {
          resolve({ ...item });
        } else {
          reject(new Error('Candidato não encontrado no sistema.'));
        }
      }, 300);
    });
  },

  // Busca pelo número digitado na urna
  async getCandidatoByNumero(numero: string, cargo?: Cargo): Promise<Candidato | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const match = CANDIDATOS_MOCK.find((c) => {
          if (cargo) {
            return c.numero === numero && c.cargo === cargo;
          }
          return c.numero === numero;
        });
        resolve(match ? { ...match } : null);
      }, 150);
    });
  },

  async getCandidatosByLado(lado: LadoPolitico): Promise<Candidato[]> {
    const lista = await this.getCandidatos();
    return lista.filter((c) => c.ladoPolitico === lado);
  },

  async getCandidatosByCargo(cargo: Cargo): Promise<Candidato[]> {
    const lista = await this.getCandidatos();
    return lista.filter((c) => c.cargo === cargo);
  },
};
