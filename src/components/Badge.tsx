import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cargo, LadoPolitico } from '@/types/candidato';

interface Props {
  tipo: 'lado' | 'cargo' | 'eleito';
  valor: LadoPolitico | Cargo | boolean;
  tamanho?: 'pequeno' | 'medio';
}

export const Badge: React.FC<Props> = ({ tipo, valor, tamanho = 'pequeno' }) => {
  let rotulo = '';
  let fundo = '#E5E7EB';
  let texto = '#374151';

  if (tipo === 'lado') {
    rotulo = valor as LadoPolitico;
    if (rotulo === 'Esquerda') {
      fundo = '#FEE2E2';
      texto = '#DC2626';
    } else if (rotulo === 'Centro') {
      fundo = '#EDE9FE';
      texto = '#7C3AED';
    } else if (rotulo === 'Direita') {
      fundo = '#DBEAFE';
      texto = '#2563EB';
    }
  } else if (tipo === 'cargo') {
    rotulo = valor as Cargo;
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
    const eleito = Boolean(valor);
    rotulo = eleito ? 'ELEITO' : 'NÃO ELEITO';
    fundo = eleito ? '#D1FAE5' : '#F3F4F6';
    texto = eleito ? '#065F46' : '#6B7280';
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
