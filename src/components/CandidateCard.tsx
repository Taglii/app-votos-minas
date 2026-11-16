import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Candidato } from '@/types/candidato';
import { Badge } from '@/components/Badge';

interface Props {
  candidato: Candidato;
  onPress?: () => void;
  onRemover?: (id: string) => void;
  salvo?: boolean;
}

export const CandidateCard: React.FC<Props> = ({
  candidato,
  onPress,
  onRemover,
  salvo = false,
}) => {
  const abrirDetalhes = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({
      pathname: '/candidato/[id]',
      params: { id: candidato.id },
    });
  };

  const votosFormatados = candidato.votos.toLocaleString('pt-BR');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={abrirDetalhes}
      activeOpacity={0.75}
    >
      <View style={styles.linhaPrincipal}>
        <View style={styles.fotoContainer}>
          <Image
            source={{ uri: candidato.foto }}
            style={styles.foto}
            resizeMode="cover"
          />
          <View style={styles.badgeNumero}>
            <Text style={styles.textoNumero}>{candidato.numero}</Text>
          </View>
        </View>

        <View style={styles.detalhes}>
          <View style={styles.topo}>
            <Text style={styles.nome} numberOfLines={1}>
              {candidato.nome}
            </Text>

            {onRemover ? (
              <TouchableOpacity
                onPress={() => onRemover(candidato.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.btnLixeira}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            ) : salvo ? (
              <Ionicons name="star" size={18} color="#F59E0B" />
            ) : null}
          </View>

          <Text style={styles.partido} numberOfLines={1}>
            {candidato.partido}
          </Text>

          <View style={styles.tags}>
            <Badge tipo="cargo" valor={candidato.cargo} tamanho="pequeno" />
            <Badge tipo="lado" valor={candidato.ladoPolitico} tamanho="pequeno" />
          </View>
        </View>
      </View>

      <View style={styles.rodape}>
        <View style={styles.contadorVotos}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.textoVotos}>{votosFormatados} votos</Text>
        </View>
        <Badge tipo="eleito" valor={candidato.situacao || candidato.eleito} tamanho="pequeno" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  linhaPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fotoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  foto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
  },
  badgeNumero: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#C8102E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textoNumero: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  detalhes: {
    flex: 1,
    justifyContent: 'center',
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 4,
  },
  partido: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contadorVotos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoVotos: {
    fontSize: 12,
    color: '#6B7280',
  },
  btnLixeira: {
    padding: 2,
  },
});
