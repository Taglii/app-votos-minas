import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  onNumero: (digito: string) => void;
  onBranco: () => void;
  onCorrige: () => void;
  onConfirma: () => void;
  desabilitado?: boolean;
}

export const UrnaTeclado: React.FC<Props> = ({
  onNumero,
  onBranco,
  onCorrige,
  onConfirma,
  desabilitado = false,
}) => {
  const criarBotaoNumero = (num: string) => (
    <TouchableOpacity
      key={num}
      style={[styles.tecla, desabilitado && styles.desabilitada]}
      onPress={() => onNumero(num)}
      disabled={desabilitado}
      activeOpacity={0.65}
    >
      <Text style={styles.textoNumero}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.corpoTeclado}>
      <View style={styles.barraTopo}>
        <View style={styles.pontoDourado} />
        <Text style={styles.textoTopo}>JUSTIÇA ELEITORAL - TRE-MG</Text>
      </View>

      <View style={styles.gridNumerico}>
        <View style={styles.linha}>
          {['1', '2', '3'].map(criarBotaoNumero)}
        </View>
        <View style={styles.linha}>
          {['4', '5', '6'].map(criarBotaoNumero)}
        </View>
        <View style={styles.linha}>
          {['7', '8', '9'].map(criarBotaoNumero)}
        </View>
        <View style={styles.linha}>
          <View style={styles.espacador} />
          {criarBotaoNumero('0')}
          <View style={styles.espacador} />
        </View>
      </View>

      <View style={styles.linhaAcoes}>
        <TouchableOpacity
          style={[styles.btnAcao, styles.btnBranco, desabilitado && styles.desabilitada]}
          onPress={onBranco}
          disabled={desabilitado}
          activeOpacity={0.7}
        >
          <Text style={styles.txtBranco}>BRANCO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnAcao, styles.btnCorrige, desabilitado && styles.desabilitada]}
          onPress={onCorrige}
          disabled={desabilitado}
          activeOpacity={0.7}
        >
          <Text style={styles.txtCorrige}>CORRIGE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnAcao, styles.btnConfirma, desabilitado && styles.desabilitada]}
          onPress={onConfirma}
          disabled={desabilitado}
          activeOpacity={0.7}
        >
          <Text style={styles.txtConfirma}>CONFIRMA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  corpoTeclado: {
    backgroundColor: '#262626',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#404040',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  barraTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pontoDourado: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  textoTopo: {
    color: '#D4D4D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  gridNumerico: {
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  tecla: {
    backgroundColor: '#171717',
    width: 60,
    height: 46,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0A0A0A',
    borderRightWidth: 2,
    borderRightColor: '#0A0A0A',
  },
  textoNumero: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '800',
  },
  espacador: {
    width: 60,
    height: 46,
  },
  linhaAcoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
    alignItems: 'flex-end',
  },
  btnAcao: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
  },
  btnBranco: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#9CA3AF',
  },
  txtBranco: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
  btnCorrige: {
    backgroundColor: '#EA580C',
    borderBottomColor: '#9A3412',
  },
  txtCorrige: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  btnConfirma: {
    backgroundColor: '#16A34A',
    borderBottomColor: '#14532D',
    height: 54, // ligeiramente mais alto como na urna real
  },
  txtConfirma: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  desabilitada: {
    opacity: 0.4,
  },
});
