export type Cargo = 'Governador' | 'Senador' | 'Deputado Federal';

export type LadoPolitico = 'Esquerda' | 'Centro-Esquerda' | 'Centro' | 'Centro-Direita' | 'Direita';

export interface Candidato {
  id: string;
  tseId?: string;
  nome: string;
  numero: string;
  cargo: Cargo;
  partido: string;
  ladoPolitico: LadoPolitico;
  votos: number;
  situacao?: string;
  eleito: boolean;
  foto: string;
  viceOuSuplente?: string;
  biografia?: string;
  propostas?: string[];
  cidadeNatal?: string;
}

export interface VotoUrnaRegistro {
  candidatoId?: string;
  numero: string;
  tipo: 'nominal' | 'branco' | 'nulo';
  cargo: Cargo;
  timestamp: number;
}
