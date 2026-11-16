import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { storageService } from '@/services/storage';
import { Candidato } from '@/types/candidato';
import { Badge } from '@/components/Badge';

export default function TelaDetalhesCandidato() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvoNaCola, setSalvoNaCola] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    if (!id) return;

    Promise.all([api.getCandidatoById(id), storageService.isFavorito(id)])
      .then(([dados, favorito]) => {
        if (ativo) {
          setCandidato(dados);
          setSalvoNaCola(favorito);
          setCarregando(false);
        }
      })
      .catch(() => {
        if (ativo) {
          Alert.alert('Erro', 'Não foi possível encontrar este candidato.');
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  const alternarSalvar = async () => {
    if (!candidato) return;
    setSalvando(true);
    try {
      const novoStatus = await storageService.toggleFavorito(candidato);
      setSalvoNaCola(novoStatus);
      const textoAviso = novoStatus
        ? 'Adicionado à sua Minha Cola!'
        : 'Removido da sua Minha Cola.';
      setAviso(textoAviso);
      setTimeout(() => setAviso(null), 3000);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar seus favoritos.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirSimuladorUrna = () => {
    if (!candidato) return;
    router.push({
      pathname: '/(tabs)/urna',
      params: { prefillNumero: candidato.numero, cargo: candidato.cargo },
    });
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.telaCentro}>
        <ActivityIndicator size="large" color="#C8102E" />
        <Text style={styles.txtCarregando}>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!candidato) {
    return (
      <SafeAreaView style={styles.telaCentro}>
        <Ionicons name="alert-circle-outline" size={46} color="#EF4444" />
        <Text style={styles.txtNaoEncontrado}>Candidato não encontrado</Text>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => router.back()}>
          <Text style={styles.txtVoltar}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const votosFormatados = candidato.votos.toLocaleString('pt-BR');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {aviso && (
          <View style={[styles.bannerAviso, salvoNaCola ? styles.avisoVerde : styles.avisoCinza]}>
            <Ionicons
              name={salvoNaCola ? 'checkmark-circle' : 'information-circle'}
              size={18}
              color={salvoNaCola ? '#15803D' : '#374151'}
            />
            <Text style={[styles.txtAviso, { color: salvoNaCola ? '#15803D' : '#374151' }]}>
              {aviso}
            </Text>
          </View>
        )}

        <View style={styles.cardPerfil}>
          <View style={styles.areaFoto}>
            <Image source={{ uri: candidato.foto }} style={styles.foto} resizeMode="cover" />
            <View style={styles.seloNumero}>
              <Text style={styles.txtSeloNumero}>{candidato.numero}</Text>
            </View>
          </View>

          <Text style={styles.nomeCandidato}>{candidato.nome}</Text>
          <Text style={styles.partidoCandidato}>{candidato.partido}</Text>

          <View style={styles.linhaTags}>
            <Badge tipo="cargo" valor={candidato.cargo} tamanho="medio" />
            <Badge tipo="lado" valor={candidato.ladoPolitico} tamanho="medio" />
            <Badge tipo="eleito" valor={candidato.eleito} tamanho="medio" />
          </View>

          <TouchableOpacity
            style={[styles.btnCola, salvoNaCola ? styles.btnColaSalvo : styles.btnColaNormal]}
            onPress={alternarSalvar}
            disabled={salvando}
            activeOpacity={0.8}
          >
            {salvando ? (
              <ActivityIndicator size="small" color={salvoNaCola ? '#C8102E' : '#FFFFFF'} />
            ) : (
              <>
                <Ionicons
                  name={salvoNaCola ? 'star' : 'star-outline'}
                  size={18}
                  color={salvoNaCola ? '#C8102E' : '#FFFFFF'}
                />
                <Text style={[styles.txtBtnCola, salvoNaCola ? styles.txtColaSalvo : styles.txtColaNormal]}>
                  {salvoNaCola ? 'Salvo na Minha Cola (Remover)' : 'Salvar na Minha Cola'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.secao}>
          <View style={styles.cabecalhoSecao}>
            <Ionicons name="stats-chart" size={18} color="#C8102E" />
            <Text style={styles.tituloSecao}>Votação em Minas Gerais</Text>
          </View>

          <View style={styles.caixaVotos}>
            <Text style={styles.numeroVotos}>{votosFormatados}</Text>
            <Text style={styles.rotuloVotos}>votos válidos computados</Text>
          </View>

          <View style={styles.caixaStatus}>
            <Text style={styles.tituloStatus}>Situação Eleitoral:</Text>
            <Text style={styles.descStatus}>
              {candidato.eleito
                ? 'Candidato ELEITO para o cargo conforme a apuração simulada.'
                : 'Candidato NÃO ELEITO neste pleito.'}
            </Text>
          </View>
        </View>

        <View style={styles.secao}>
          <View style={styles.cabecalhoSecao}>
            <Ionicons name="information-circle-outline" size={18} color="#C8102E" />
            <Text style={styles.tituloSecao}>Dados da Candidatura</Text>
          </View>

          {candidato.viceOuSuplente && (
            <View style={styles.itemInfo}>
              <Text style={styles.rotuloInfo}>Vice / Suplente:</Text>
              <Text style={styles.valorInfo}>{candidato.viceOuSuplente}</Text>
            </View>
          )}

          {candidato.cidadeNatal && (
            <View style={styles.itemInfo}>
              <Text style={styles.rotuloInfo}>Origem:</Text>
              <Text style={styles.valorInfo}>{candidato.cidadeNatal}</Text>
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={styles.rotuloInfo}>Número de urna:</Text>
            <Text style={styles.valorDestaque}>{candidato.numero}</Text>
          </View>
        </View>

        {candidato.biografia && (
          <View style={styles.secao}>
            <View style={styles.cabecalhoSecao}>
              <Ionicons name="document-text-outline" size={18} color="#C8102E" />
              <Text style={styles.tituloSecao}>Biografia</Text>
            </View>
            <Text style={styles.textoBiografia}>{candidato.biografia}</Text>
          </View>
        )}

        {candidato.propostas && candidato.propostas.length > 0 && (
          <View style={styles.secao}>
            <View style={styles.cabecalhoSecao}>
              <Ionicons name="list-outline" size={18} color="#C8102E" />
              <Text style={styles.tituloSecao}>Principais Propostas</Text>
            </View>
            {candidato.propostas.map((prop, idx) => (
              <View key={idx} style={styles.linhaProposta}>
                <Ionicons name="checkbox-outline" size={16} color="#C8102E" style={styles.iconeProposta} />
                <Text style={styles.textoProposta}>{prop}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.btnIrUrna} onPress={abrirSimuladorUrna} activeOpacity={0.8}>
          <Ionicons name="calculator-outline" size={20} color="#FFFFFF" />
          <Text style={styles.txtIrUrna}>Treinar voto deste candidato na Urna ({candidato.numero})</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  telaCentro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  txtCarregando: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  txtNaoEncontrado: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
    marginBottom: 14,
  },
  btnVoltar: {
    backgroundColor: '#C8102E',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  txtVoltar: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bannerAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  avisoVerde: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  avisoCinza: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  txtAviso: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardPerfil: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    marginBottom: 14,
  },
  areaFoto: {
    position: 'relative',
    marginBottom: 12,
  },
  foto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#C8102E',
  },
  seloNumero: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#C8102E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  txtSeloNumero: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  nomeCandidato: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  partidoCandidato: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  linhaTags: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnCola: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
  },
  btnColaNormal: {
    backgroundColor: '#C8102E',
  },
  btnColaSalvo: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#C8102E',
  },
  txtBtnCola: {
    fontSize: 13,
    fontWeight: '700',
  },
  txtColaNormal: {
    color: '#FFFFFF',
  },
  txtColaSalvo: {
    color: '#C8102E',
  },
  secao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 6,
  },
  tituloSecao: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  caixaVotos: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  numeroVotos: {
    fontSize: 24,
    fontWeight: '900',
    color: '#C8102E',
  },
  rotuloVotos: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
    marginTop: 2,
  },
  caixaStatus: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  tituloStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  descStatus: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 2,
    lineHeight: 16,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rotuloInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  valorInfo: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  valorDestaque: {
    fontSize: 15,
    color: '#C8102E',
    fontWeight: '800',
  },
  textoBiografia: {
    fontSize: 13,
    lineHeight: 20,
    color: '#374151',
  },
  linhaProposta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  iconeProposta: {
    marginTop: 2,
  },
  textoProposta: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#374151',
    flex: 1,
  },
  btnIrUrna: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 12,
  },
  txtIrUrna: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
