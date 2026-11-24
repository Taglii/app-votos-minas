const fs = require('fs');

const subpasta = 'fotoscandidados';
const pastaFotos = `./assets/${subpasta}`;

const arquivos = fs
  .readdirSync(pastaFotos)
  .filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

const linhas = arquivos.map((arquivo) => {
  const tseId = arquivo
    .replace(/^F[A-Z]{2}/i, '')
    .replace(/_div\.[^.]+$/i, '')
    .replace(/\.[^.]+$/, '');

  return `  '${tseId}': require('../../assets/${subpasta}/${arquivo}'),`;
});

if (!fs.existsSync('./src/data')) {
  fs.mkdirSync('./src/data', { recursive: true });
}

const conteudo = `import { ImageSourcePropType } from 'react-native';

export const FOTOS_LOCAIS: Record<string, ImageSourcePropType> = {
${linhas.join('\n')}
};
`;

fs.writeFileSync('./src/data/fotosCandidatos.ts', conteudo, 'utf-8');
console.log(`Pronto! ${arquivos.length} fotos vinculadas em src/data/fotosCandidatos.ts`);