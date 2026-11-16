import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cargo, LadoPolitico } from '@/types/candidato';

interface Props {
  tipo: 'lado' | 'cargo' | 'eleito';
  valor: LadoPolitico | Cargo | boolean | string;
  tamanho?: 'pequeno' | 'medio';
}

export const Badge: React.FC<Props> = ({ tipo, valor, tamanho = 'pequeno' }) => {
  let rotulo = '';
  let fundo = '#E5E7EB';
  let texto = '#374151';

  if (tipo === 'lado') {
    rotulo = String(valor);
    if (rotulo === 'Esquerda') {
      fundo = '#FEE2E2';
      texto = '#DC2626';
    } else if (rotulo === 'Centro-Esquerda') {
      fundo = '#FCE7F3';
      texto = '#BE185D';
    } else if (rotulo === 'Centro') {
      fundo = '#EDE9FE';
      texto = '#7C3AED';
    } else if (rotulo === 'Centro-Direita') {
      fundo = '#E0F2FE';
      texto = '#0369A1';
    } else if (rotulo === 'Direita') {
      fundo = '#DBEAFE';
      texto = '#2563EB';
    }
  } else if (tipo === 'cargo') {
    rotulo = String(valor);
    if (rotulo === 'Governador') {
      fundo = '#DCFCE7';
      texto = '#15803D';
    } else if (rotulo === 'Senador') {
      fundo = '#FEF3C7';
      texto = '#B45309';
    } else if (rotulo === 'Deputado Federal') {
      fundo = '#CCFBF1';
      texto = '#0F766E';
    }
  } else if (tipo === 'eleito') {
    if (typeof valor === 'boolean') {
      rotulo = valor ? 'ELEITO' : 'NÃO ELEITO';
      fundo = valor ? '#D1FAE5' : '#F3F4F6';
      texto = valor ? '#065F46' : '#6B7280';
    } else {
      rotulo = String(valor).toUpperCase();
      if (rotulo.includes('ELEITO') && !rotulo.includes('NÃO')) {
        fundo = '#D1FAE5';
        texto = '#065F46';
      } else if (rotulo.includes('SUPLENTE')) {
        fundo = '#FEF3C7';
        texto = '#B45309';
      } else {
        fundo = '#F3F4F6';
        texto = '#6B7280';
      }
    }
  }

  const ehPequeno = tamanho === 'pequeno';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: fundo },
        ehPequeno ? styles.badgePequeno : styles.badgeMedio,
      ]}
    >
      <Text
        style={[
          styles.texto,
          { color: texto },
          ehPequeno ? styles.textoPequeno : styles.textoMedio,
        ]}
      >
        {rotulo}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePequeno: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  badgeMedio: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  texto: {
    fontWeight: '700',
  },
  textoPequeno: {
    fontSize: 10.5,
  },
  textoMedio: {
    fontSize: 12.5,
  },
});
