import { CandidateCard } from '@/components/CandidateCard';
import { api } from '@/services/api';
import { storageService } from '@/services/storage';
import { Candidato, Cargo, LadoPolitico } from '@/types/candidato';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TelaInicio() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [totalVotos, setTotalVotos] = useState(0);
  const [filtroLado, setFiltroLado] = useState<LadoPolitico | 'Todos'>('Todos');
  const [filtroCargo, setFiltroCargo] = useState<Cargo | 'Todos'>('Todos');

  const carregarDados = async () => {
    try {
      const [lista, total] = await Promise.all([
        api.getCandidatos(),
        storageService.getTotalVotosSimulados(),
      ]);
      setCandidatos(lista);
      setTotalVotos(total);
    } catch (e) {
      console.log('Erro ao carregar dados:', e);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      storageService.getTotalVotosSimulados().then((total) => {
        if (ativo) setTotalVotos(total);
      });
      return () => {
        ativo = false;
      };
    }, [])
  );

  useEffect(() => {
    let ativo = true;

    Promise.all([api.getCandidatos(), storageService.getTotalVotosSimulados()])
      .then(([lista, total]) => {
        if (ativo) {
          setCandidatos(lista);
          setTotalVotos(total);
          setCarregando(false);
        }
      })
      .catch(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const puxarAtualizar = () => {
    setAtualizando(true);
    api.limparCache();
    carregarDados();
  };

  // Contagens para os resumos
  const totalPresidentes = candidatos.filter((c) => c.cargo === 'Presidente').length;
  const totalGovernadores = candidatos.filter((c) => c.cargo === 'Governador').length;
  const totalSenadores = candidatos.filter((c) => c.cargo === 'Senador').length;
  const totalDeputadosFederais = candidatos.filter((c) => c.cargo === 'Deputado Federal').length;
  const totalDeputadosEstaduais = candidatos.filter((c) => c.cargo === 'Deputado Estadual').length;

  const ladosDisponiveis: (LadoPolitico | 'Todos')[] = [
    'Todos',
    'Esquerda',
    'Centro-Esquerda',
    'Centro',
    'Direita',
  ];

  // Filtro rapido para exibir os destaques no painel
  const listaFiltrada = candidatos.filter((c) => {
    const bateuLado = filtroLado === 'Todos' || c.ladoPolitico === filtroLado;
    const bateuCargo = filtroCargo === 'Todos' || c.cargo === filtroCargo;
    return bateuLado && bateuCargo;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={puxarAtualizar}
            colors={['#C8102E']}
            tintColor="#C8102E"
          />
        }
      >
        <View style={styles.banner}>
          <Text style={styles.subtituloBanner}>MINAS GERAIS</Text>
          <Text style={styles.tituloBanner}>Eleições Gerais 1º Turno</Text>
          <Text style={styles.lema}>&ldquo;Libertas Quæ Sera Tamen&rdquo;</Text>
          <Text style={styles.descricaoBanner}>
            Acompanhe os candidatos de Minas, monte sua cola para o dia da votação e treine na urna eletrônica.
          </Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.tituloBloco}>Panorama Eleitoral</Text>

          {carregando ? (
            <View style={styles.carregandoRow}>
              <ActivityIndicator size="small" color="#C8102E" />
              <Text style={styles.carregandoTexto}>Carregando dados da API...</Text>
            </View>
          ) : (
            <View style={styles.gridEstatisticas}>
              <View style={[styles.cardStat, styles.cardVermelho]}>
                <Ionicons name="people" size={22} color="#C8102E" />
                <Text style={styles.numeroStat}>{candidatos.length}</Text>
                <Text style={styles.legendaStat}>Candidatos na API</Text>
              </View>

              <View style={[styles.cardStat, styles.cardVerde]}>
                <Ionicons name="checkmark-done-circle" size={22} color="#15803D" />
                <Text style={styles.numeroStat}>{totalVotos}</Text>
                <Text style={styles.legendaStat}>Votos na Urna</Text>
              </View>
            </View>
          )}

          <View style={styles.linhaCargos}>
            <View style={styles.miniCardCargo}>
              <Text style={styles.valorMini}>{totalPresidentes}</Text>
              <Text style={styles.rotuloMini}>Presidente</Text>
            </View>
            <View style={styles.miniCardCargo}>
              <Text style={styles.valorMini}>{totalGovernadores}</Text>
              <Text style={styles.rotuloMini}>Governador</Text>
            </View>
            <View style={styles.miniCardCargo}>
              <Text style={styles.valorMini}>{totalSenadores}</Text>
              <Text style={styles.rotuloMini}>Senador</Text>
            </View>
            <View style={styles.miniCardCargo}>
              <Text style={styles.valorMini}>{totalDeputadosFederais}</Text>
              <Text style={styles.rotuloMini}>Dep. Fed.</Text>
            </View>
            <View style={styles.miniCardCargo}>
              <Text style={styles.valorMini}>{totalDeputadosEstaduais}</Text>
              <Text style={styles.rotuloMini}>Dep. Est.</Text>
            </View>
          </View>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.tituloBloco}>Acesso Rápido</Text>

          <View style={styles.linhaAtalhos}>
            <TouchableOpacity
              style={styles.btnAtalho}
              onPress={() => router.push('/(tabs)/candidatos')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconeAtalho, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="search" size={20} color="#2563EB" />
              </View>
              <Text style={styles.nomeAtalho}>Candidatos</Text>
              <Text style={styles.descAtalho}>Ver e filtrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnAtalho}
              onPress={() => router.push('/(tabs)/urna')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconeAtalho, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="calculator" size={20} color="#059669" />
              </View>
              <Text style={styles.nomeAtalho}>Simular Urna</Text>
              <Text style={styles.descAtalho}>Treinar voto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnAtalho}
              onPress={() => router.push('/(tabs)/favoritos')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconeAtalho, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="bookmark" size={20} color="#D97706" />
              </View>
              <Text style={styles.nomeAtalho}>Minha Cola</Text>
              <Text style={styles.descAtalho}>Seus salvos</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.tituloBloco}>Filtrar no Painel</Text>

          <Text style={styles.rotuloFiltro}>Espectro político:</Text>
          <View style={styles.linhaChips}>
            {ladosDisponiveis.map((item) => {
              const ativo = filtroLado === item;
              const contagem = item === 'Todos' ? candidatos.length : candidatos.filter((c) => c.ladoPolitico === item).length;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  onPress={() => setFiltroLado(item)}
                >
                  <Text style={[styles.txtChip, ativo && styles.txtChipAtivo]}>
                    {item} ({contagem})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.rotuloFiltro}>Cargo:</Text>
          <View style={styles.linhaChips}>
            {(
              [
                'Todos',
                'Presidente',
                'Governador',
                'Senador',
                'Deputado Federal',
                'Deputado Estadual',
              ] as const
            ).map((item) => {
              const ativo = filtroCargo === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  onPress={() => setFiltroCargo(item)}
                >
                  <Text style={[styles.txtChip, ativo && styles.txtChipAtivo]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.bloco}>
          <View style={styles.cabecalhoSecao}>
            <Text style={styles.tituloBloco}>
              Candidatos ({listaFiltrada.length})
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/candidatos')}>
              <Text style={styles.linkVerMais}>Ver todos &gt;</Text>
            </TouchableOpacity>
          </View>

          {listaFiltrada.slice(0, 4).map((candidato) => (
            <CandidateCard key={candidato.id} candidato={candidato} />
          ))}

          {listaFiltrada.length > 4 && (
            <TouchableOpacity
              style={styles.btnVerTodos}
              onPress={() => router.push('/(tabs)/candidatos')}
            >
              <Text style={styles.txtVerTodos}>
                Ver mais {listaFiltrada.length - 4} candidatos
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    paddingBottom: 24,
  },
  banner: {
    backgroundColor: '#C8102E',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  subtituloBanner: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tituloBanner: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  lema: {
    color: '#FEF08A',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 8,
  },
  descricaoBanner: {
    color: '#F3F4F6',
    fontSize: 13,
    lineHeight: 18,
  },
  bloco: {
    marginTop: 18,
  },
  tituloBloco: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  linkVerMais: {
    color: '#C8102E',
    fontWeight: '700',
    fontSize: 13,
    marginRight: 16,
  },
  carregandoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    padding: 10,
  },
  carregandoTexto: {
    color: '#6B7280',
    fontSize: 13,
  },
  gridEstatisticas: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardStat: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardVermelho: {
    borderLeftWidth: 4,
    borderLeftColor: '#C8102E',
  },
  cardVerde: {
    borderLeftWidth: 4,
    borderLeftColor: '#15803D',
  },
  numeroStat: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  legendaStat: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  linhaCargos: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 5,
    marginTop: 10,
  },
  miniCardCargo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  valorMini: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  rotuloMini: {
    fontSize: 9.5,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  linhaAtalhos: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  btnAtalho: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  iconeAtalho: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  nomeAtalho: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  descAtalho: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  rotuloFiltro: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  linhaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
  btnVerTodos: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  txtVerTodos: {
    color: '#C8102E',
    fontWeight: '700',
    fontSize: 13,
  },
});
