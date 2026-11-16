import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { Candidato, Cargo, LadoPolitico } from '@/types/candidato';
import { CandidateCard } from '@/components/CandidateCard';

export default function TelaCandidatos() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [recarregando, setRecarregando] = useState(false);
  const [textoBusca, setTextoBusca] = useState('');
  const [ladoSelecionado, setLadoSelecionado] = useState<LadoPolitico | 'Todos'>('Todos');
  const [cargoSelecionado, setCargoSelecionado] = useState<Cargo | 'Todos'>('Todos');

  const buscarCandidatos = async (forcarErro = false) => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.getCandidatos(forcarErro);
      setCandidatos(dados);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar a lista de candidatos.');
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  };

  useEffect(() => {
    let ativo = true;

    api
      .getCandidatos(false)
      .then((dados) => {
        if (ativo) {
          setCandidatos(dados);
          setCarregando(false);
        }
      })
      .catch((e: any) => {
        if (ativo) {
          setErro(e?.message || 'Falha ao buscar candidatos.');
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const aoPuxar = () => {
    setRecarregando(true);
    api.limparCache();
    buscarCandidatos(false);
  };

  const tentarDeNovo = () => {
    buscarCandidatos(false);
  };

  const limparFiltros = () => {
    setTextoBusca('');
    setLadoSelecionado('Todos');
    setCargoSelecionado('Todos');
  };

  const ladosOpcoes: (LadoPolitico | 'Todos')[] = [
    'Todos',
    'Esquerda',
    'Centro-Esquerda',
    'Centro',
    'Direita',
  ];

  const listaFiltrada = useMemo(() => {
    const termo = textoBusca.trim().toLowerCase();
    return candidatos.filter((c) => {
      const bateuTexto =
        termo === '' ||
        c.nome.toLowerCase().includes(termo) ||
        c.numero.includes(termo) ||
        c.partido.toLowerCase().includes(termo);

      const bateuLado = ladoSelecionado === 'Todos' || c.ladoPolitico === ladoSelecionado;
      const bateuCargo = cargoSelecionado === 'Todos' || c.cargo === cargoSelecionado;

      return bateuTexto && bateuLado && bateuCargo;
    });
  }, [candidatos, textoBusca, ladoSelecionado, cargoSelecionado]);

  if (carregando && !recarregando) {
    return (
      <SafeAreaView style={styles.telaCentro}>
        <ActivityIndicator size="large" color="#C8102E" />
        <Text style={styles.tituloCarregando}>Carregando candidatos...</Text>
        <Text style={styles.subCarregando}>Buscando os registros da API oficial de Minas Gerais</Text>
      </SafeAreaView>
    );
  }

  if (erro) {
    return (
      <SafeAreaView style={styles.telaCentro}>
        <View style={styles.bolaErro}>
          <Ionicons name="alert-circle" size={42} color="#EF4444" />
        </View>
        <Text style={styles.tituloErro}>Ops! Algo deu errado</Text>
        <Text style={styles.msgErro}>{erro}</Text>
        <TouchableOpacity style={styles.btnTentar} onPress={tentarDeNovo} activeOpacity={0.8}>
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.txtTentar}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.topoFiltros}>
        <View style={styles.campoBusca}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.iconeBusca} />
          <TextInput
            style={styles.input}
            placeholder="Buscar por nome, número ou partido..."
            placeholderTextColor="#9CA3AF"
            value={textoBusca}
            onChangeText={setTextoBusca}
            returnKeyType="search"
          />
          {textoBusca.length > 0 && (
            <TouchableOpacity onPress={() => setTextoBusca('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.grupoFiltro}>
          <Text style={styles.rotulo}>Lado Político:</Text>
          <View style={styles.linhaChips}>
            {ladosOpcoes.map((item) => {
              const ativo = ladoSelecionado === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  onPress={() => setLadoSelecionado(item)}
                >
                  <Text style={[styles.txtChip, ativo && styles.txtChipAtivo]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.grupoFiltro}>
          <Text style={styles.rotulo}>Cargo:</Text>
          <View style={styles.linhaChips}>
            {(['Todos', 'Governador', 'Senador', 'Deputado Federal'] as const).map((item) => {
              const ativo = cargoSelecionado === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  onPress={() => setCargoSelecionado(item)}
                >
                  <Text style={[styles.txtChip, ativo && styles.txtChipAtivo]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.barraResultado}>
        <Text style={styles.qtdResultado}>
          {listaFiltrada.length} candidato(s) encontrado(s)
        </Text>
        <TouchableOpacity onPress={() => buscarCandidatos(true)}>
          <Text style={styles.btnSimularErro}>[Testar tela de erro]</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CandidateCard
            candidato={item}
            onPress={() => {
              router.push({
                pathname: '/candidato/[id]',
                params: { id: item.id },
              });
            }}
          />
        )}
        initialNumToRender={12}
        maxToRenderPerBatch={15}
        windowSize={7}
        removeClippedSubviews={Platform.OS !== 'web'}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={aoPuxar}
            colors={['#C8102E']}
            tintColor="#C8102E"
          />
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="search-outline" size={38} color="#9CA3AF" />
            <Text style={styles.tituloVazio}>Nenhum candidato encontrado</Text>
            <Text style={styles.descVazio}>
              Tente digitar outro nome/número ou selecione outros filtros.
            </Text>
            {(textoBusca !== '' || ladoSelecionado !== 'Todos' || cargoSelecionado !== 'Todos') && (
              <TouchableOpacity style={styles.btnLimpar} onPress={limparFiltros}>
                <Text style={styles.txtLimpar}>Limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  telaCentro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  tituloCarregando: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  subCarregando: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  bolaErro: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloErro: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  msgErro: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    maxWidth: 280,
    lineHeight: 18,
  },
  btnTentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C8102E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  txtTentar: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  topoFiltros: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  campoBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  iconeBusca: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    height: '100%',
  },
  grupoFiltro: {
    marginTop: 8,
  },
  rotulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  linhaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipAtivo: {
    backgroundColor: '#C8102E',
    borderColor: '#C8102E',
  },
  txtChip: {
    fontSize: 11.5,
    color: '#4B5563',
    fontWeight: '600',
  },
  txtChipAtivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  barraResultado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  qtdResultado: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  btnSimularErro: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  lista: {
    paddingBottom: 20,
  },
  vazio: {
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  tituloVazio: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  descVazio: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  btnLimpar: {
    marginTop: 12,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  txtLimpar: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
});
