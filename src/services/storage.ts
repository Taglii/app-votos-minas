import AsyncStorage from '@react-native-async-storage/async-storage';
import { Candidato, VotoUrnaRegistro } from '@/types/candidato';

const CHAVE_COLA = '@voto_minas:favoritos';
const CHAVE_VOTOS = '@voto_minas:votos_urna';
const CHAVE_TOTAL = '@voto_minas:total_votos_simulados';
const CHAVE_CANDIDATOS_CACHE = '@voto_minas:candidatos_cache';

export const storageService = {
  // Retorna os candidatos em cache offline
  async getCandidatosCache(): Promise<Candidato[] | null> {
    try {
      const json = await AsyncStorage.getItem(CHAVE_CANDIDATOS_CACHE);
      if (!json) return null;
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Candidato[]) : null;
    } catch {
      return null;
    }
  },

  // Salva os candidatos no cache offline
  async salvarCandidatosCache(candidatos: Candidato[]): Promise<void> {
    try {
      if (Array.isArray(candidatos) && candidatos.length > 0) {
        await AsyncStorage.setItem(CHAVE_CANDIDATOS_CACHE, JSON.stringify(candidatos));
      }
    } catch (e) {
      console.warn('Falha ao salvar cache de candidatos:', e);
    }
  },
  // Retorna os candidatos salvos na cola
  async getFavoritos(): Promise<Candidato[]> {
    try {
      const json = await AsyncStorage.getItem(CHAVE_COLA);
      return json ? (JSON.parse(json) as Candidato[]) : [];
    } catch {
      return [];
    }
  },

  // Checa se o candidato já está na cola
  async isFavorito(id: string): Promise<boolean> {
    try {
      const lista = await this.getFavoritos();
      return lista.some((item) => item.id === id);
    } catch {
      return false;
    }
  },

  // Adiciona na cola caso ainda não esteja
  async adicionarFavorito(candidato: Candidato): Promise<boolean> {
    const lista = await this.getFavoritos();
    if (lista.some((item) => item.id === candidato.id)) {
      return false;
    }
    await AsyncStorage.setItem(CHAVE_COLA, JSON.stringify([...lista, candidato]));
    return true;
  },

  // Remove da cola pelo id
  async removerFavorito(id: string): Promise<boolean> {
    const lista = await this.getFavoritos();
    const filtrada = lista.filter((item) => item.id !== id);
    await AsyncStorage.setItem(CHAVE_COLA, JSON.stringify(filtrada));
    return true;
  },

  // Adiciona ou remove da cola
  async toggleFavorito(candidato: Candidato): Promise<boolean> {
    const jaSalvo = await this.isFavorito(candidato.id);
    if (jaSalvo) {
      await this.removerFavorito(candidato.id);
      return false;
    }
    await this.adicionarFavorito(candidato);
    return true;
  },

  // Limpa todos os favoritos
  async limparFavoritos(): Promise<void> {
    await AsyncStorage.removeItem(CHAVE_COLA);
  },

  // Salva o voto registrado na urna simulada
  async registrarVoto(voto: VotoUrnaRegistro): Promise<void> {
    const json = await AsyncStorage.getItem(CHAVE_VOTOS);
    const votos: VotoUrnaRegistro[] = json ? JSON.parse(json) : [];
    votos.push(voto);
    await AsyncStorage.setItem(CHAVE_VOTOS, JSON.stringify(votos));

    const totalAtual = await this.getTotalVotosSimulados();
    await AsyncStorage.setItem(CHAVE_TOTAL, String(totalAtual + 1));
  },

  // Total de votos computados
  async getTotalVotosSimulados(): Promise<number> {
    try {
      const total = await AsyncStorage.getItem(CHAVE_TOTAL);
      return total ? parseInt(total, 10) : 0;
    } catch {
      return 0;
    }
  },

  // Reseta os dados da urna
  async zerarUrna(): Promise<void> {
    await AsyncStorage.removeItem(CHAVE_VOTOS);
    await AsyncStorage.setItem(CHAVE_TOTAL, '0');
  },
};
