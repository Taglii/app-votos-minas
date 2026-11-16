export type Cargo = 'Governador' | 'Senador' | 'Deputado Federal';

export type LadoPolitico = 'Esquerda' | 'Centro' | 'Direita';

export interface Candidato {
  id: string;
  nome: string;
  numero: string;
  cargo: Cargo;
  partido: string;
  ladoPolitico: LadoPolitico;
  votos: number;
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
