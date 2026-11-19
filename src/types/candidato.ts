export type Cargo =
  | 'Presidente'
  | 'Governador'
  | 'Senador'
  | 'Deputado Federal'
  | 'Deputado Estadual';

export type LadoPolitico =
  | 'Esquerda'
  | 'Centro-Esquerda'
  | 'Centro'
  | 'Centro-Direita'
  | 'Direita';

export interface Candidato {
  id: string;
  tseId?: string;
  nome: string;
  nomeCompleto?: string;
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
  ocupacao?: string;
  escolaridade?: string;
  patrimonioDeclarado?: number;
  bensDeclarados?: boolean;
  cnpjCampanha?: string;
  estado?: string;
}

export interface VotoUrnaRegistro {
  candidatoId?: string;
  numero: string;
  tipo: 'nominal' | 'branco' | 'nulo';
  cargo: Cargo;
  timestamp: number;
}
