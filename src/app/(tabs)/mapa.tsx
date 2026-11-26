import { Ionicons } from '@expo/vector-icons';
import { geoMercator, geoPath } from 'd3-geo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    GestureResponderHandlers,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import mgGeoJsonRaw from '@/data/mgMunicipios.json';
import votosPorCidadeRaw from '@/data/votosPorCidadeMG.json';
import { api } from '@/services/api';

type CargoMapa = 'governador' | 'presidente' | 'senador';

interface CandidatoCidade {
  numero: string;
  nome: string;
  partido: string;
  votos: number;
}

interface DadosCidade {
  codigoIbge?: string;
  codarea?: string;
  ibge?: string;
  nome: string;
  presidente: CandidatoCidade[];
  governador: CandidatoCidade[];
  senador: CandidatoCidade[];
}

interface MunicipioIndexado {
  id: string; // Código IBGE de 7 dígitos (codarea)
  nome: string;
  nomeNormalizado: string;
  termosBusca: string[];
  dados?: DadosCidade;
}

const votosPorCidade = votosPorCidadeRaw as Record<string, DadosCidade>;

const CORES_PARTIDO: Record<string, string> = {
  NOVO: '#F3722C',
  PT: '#C8102E',
  PL: '#1D3557',
  PSD: '#F59E0B',
  MDB: '#10B981',
  REPUBLICANOS: '#0284C7',
  PP: '#2563EB',
  UNIÃO: '#3B82F6',
  PDT: '#DC2626',
  PSOL: '#7C3AED',
};

const CIDADES_DESTAQUE_IBGE = [
  '3106200', // Belo Horizonte
  '3170206', // Uberlândia
  '3118601', // Contagem
  '3136702', // Juiz de Fora
  '3143302', // Montes Claros
];

const IBGE_JUIZ_DE_FORA = '3136702';

// Aliases entre grafias do IBGE (GeoJSON) e do TSE (votosPorCidadeMG.json)
const ALIASES_MUNICIPIOS_MG: Record<string, string[]> = {
  'sao tome das letras': ['sao thome das letras'],
  'sao thome das letras': ['sao tome das letras'],
  'dona euzebia': ['dona eusebia'],
  'dona eusebia': ['dona euzebia'],
  'barao do monte alto': ['barao de monte alto'],
  'barao de monte alto': ['barao do monte alto'],
  'olhos d agua': ['olhos dagua'],
  'pingo d agua': ['pingo dagua'],
};

const normalizarTexto = (texto: string) =>
  (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-–—'’`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const obterCodigoIbgeFeature = (feature: any, fallbackIndex: number): string => {
  const bruto =
    feature?.properties?.codarea ??
    feature?.properties?.CD_MUN ??
    feature?.properties?.codigo_ibge ??
    feature?.properties?.ibge ??
    feature?.id;
  const limpo = String(bruto || '').replace(/\D/g, '');
  return limpo.length === 7 ? limpo : String(bruto || fallbackIndex);
};

const obterNomeFeature = (feature: any): string =>
  String(
    feature?.properties?.nome ||
      feature?.properties?.name ||
      feature?.properties?.NM_MUN ||
      ''
  ).trim();

const corrigirWindingOrderGeoJson = (geo: any) => ({
  ...geo,
  features: (geo.features || []).map((f: any) => {
    const geom = f.geometry;
    if (!geom) return f;

    if (geom.type === 'Polygon') {
      return {
        ...f,
        geometry: {
          ...geom,
          coordinates: geom.coordinates.map((ring: any[]) => [...ring].reverse()),
        },
      };
    }

    if (geom.type === 'MultiPolygon') {
      return {
        ...f,
        geometry: {
          ...geom,
          coordinates: geom.coordinates.map((poly: any[]) =>
            poly.map((ring: any[]) => [...ring].reverse())
          ),
        },
      };
    }

    return f;
  }),
});

export default function MapaMinasScreen() {
  const [cargoSelecionado, setCargoSelecionado] = useState<CargoMapa>('governador');
  const [cidadeSelecionadaId, setCidadeSelecionadaId] = useState<string>(IBGE_JUIZ_DE_FORA);
  const [busca, setBusca] = useState<string>('');
  const [presidentesApi, setPresidentesApi] = useState<CandidatoCidade[]>([]);

  // Trava o scroll da página enquanto o usuário arrasta/dá zoom no mapa
  const [interagindoMapa, setInteragindoMapa] = useState(false);

  const larguraMapa = Dimensions.get('window').width - 48;
  const alturaMapa = Math.round(larguraMapa * 0.85);

  // Estado de Zoom e Pan (deslocamento X/Y)
  const [camera, setCamera] = useState({ scale: 1, x: 0, y: 0 });
  const cameraRef = useRef({ scale: 1, x: 0, y: 0 });
  const gestoInicial = useRef({
    distancia: 0,
    scale: 1,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
  });

  const atualizarCamera = useCallback(
    (novoScale: number, novoX: number, novoY: number) => {
      const scaleLimitado = Math.min(Math.max(novoScale, 1), 8);
      const maxPanX = (larguraMapa * (scaleLimitado - 1)) / 2;
      const maxPanY = (alturaMapa * (scaleLimitado - 1)) / 2;

      const xLimitado = scaleLimitado === 1 ? 0 : Math.min(Math.max(novoX, -maxPanX), maxPanX);
      const yLimitado = scaleLimitado === 1 ? 0 : Math.min(Math.max(novoY, -maxPanY), maxPanY);

      const estado = { scale: scaleLimitado, x: xLimitado, y: yLimitado };
      cameraRef.current = estado;
      setCamera(estado);
    },
    [larguraMapa, alturaMapa]
  );

  const aplicarZoomBotao = (fator: number) => {
    const { scale, x, y } = cameraRef.current;
    atualizarCamera(scale * fator, x * fator, y * fator);
  };

  const resetarZoom = () => {
    atualizarCamera(1, 0, 0);
  };

  // PanResponder para gesto de Pinça (2 dedos) e Arrastar (1 dedo)
  const [panHandlers, setPanHandlers] = useState<GestureResponderHandlers>({});

  useEffect(() => {
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.numberActiveTouches >= 2 ||
        (cameraRef.current.scale > 1 && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4)),
      onPanResponderGrant: (evt) => {
        setInteragindoMapa(true);
        const touches = evt.nativeEvent.touches;
        let dist = 0;
        if (touches.length >= 2) {
          dist = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
        }
        gestoInicial.current = {
          distancia: dist,
          scale: cameraRef.current.scale,
          x: cameraRef.current.x,
          y: cameraRef.current.y,
          dx: 0,
          dy: 0,
        };
      },
      onPanResponderMove: (evt, gesture) => {
        const touches = evt.nativeEvent.touches;

        // Gesto de Pinça com 2 dedos
        if (touches.length >= 2) {
          const distAtual = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
          if (gestoInicial.current.distancia === 0) {
            gestoInicial.current.distancia = distAtual;
            gestoInicial.current.scale = cameraRef.current.scale;
          } else {
            const novoScale =
              gestoInicial.current.scale * (distAtual / gestoInicial.current.distancia);
            atualizarCamera(novoScale, cameraRef.current.x, cameraRef.current.y);
          }
          return;
        }

        // Arrastar com 1 dedo quando estiver com zoom
        if (cameraRef.current.scale > 1) {
          atualizarCamera(
            cameraRef.current.scale,
            gestoInicial.current.x + gesture.dx,
            gestoInicial.current.y + gesture.dy
          );
        }
      },
      onPanResponderRelease: () => setInteragindoMapa(false),
      onPanResponderTerminate: () => setInteragindoMapa(false),
    });

    setPanHandlers(responder.panHandlers);
  }, [atualizarCamera]);

  useEffect(() => {
    api
      .getCandidatosByCargo('Presidente')
      .then((lista) => {
        const top3 = [...lista]
          .sort((a, b) => (b.votos || 0) - (a.votos || 0))
          .slice(0, 3)
          .map((c) => ({
            numero: c.numero,
            nome: c.nome,
            partido: c.partido,
            votos: c.votos || 0,
          }));
        setPresidentesApi(top3);
      })
      .catch(() => {});
  }, []);

  const {
    geoCorrigido,
    municipiosIndex,
    municipiosPorId,
    votosSemCorrespondencia,
    municipiosSemVotos,
  } = useMemo(() => {
    const geo = corrigirWindingOrderGeoJson(mgGeoJsonRaw);

    const votosPorIbge = new Map<string, { chave: string; dados: DadosCidade }>();
    const votosPorNome = new Map<string, { chave: string; dados: DadosCidade }>();

    for (const [chave, dados] of Object.entries(votosPorCidade)) {
      const ibgeBruto = String(dados.codigoIbge || dados.codarea || dados.ibge || '').replace(
        /\D/g,
        ''
      );
      if (ibgeBruto.length === 7) {
        votosPorIbge.set(ibgeBruto, { chave, dados });
      }
      const normNome = normalizarTexto(dados.nome || chave);
      if (normNome) {
        votosPorNome.set(normNome, { chave, dados });
      }
      const normChave = normalizarTexto(chave);
      if (normChave && !votosPorNome.has(normChave)) {
        votosPorNome.set(normChave, { chave, dados });
      }
    }

    const chavesVotosCasadas = new Set<string>();
    const semVotos: { id: string; nome: string }[] = [];
    const listaIndex: MunicipioIndexado[] = [];
    const mapaPorId: Record<string, MunicipioIndexado> = {};

    (geo.features || []).forEach((feature: any, index: number) => {
      const id = obterCodigoIbgeFeature(feature, index);
      const nome = obterNomeFeature(feature);
      const nomeNormalizado = normalizarTexto(nome);

      // 1. Prioriza correspondência pelo código IBGE de 7 dígitos
      let match = votosPorIbge.get(id);

      // 2. Fallback por nome normalizado
      if (!match && nomeNormalizado) {
        match = votosPorNome.get(nomeNormalizado);
      }

      // 3. Fallback por aliases conhecidos de grafia em MG
      if (!match && nomeNormalizado) {
        const aliases = ALIASES_MUNICIPIOS_MG[nomeNormalizado] || [];
        for (const alias of aliases) {
          const encontrado = votosPorNome.get(alias);
          if (encontrado) {
            match = encontrado;
            break;
          }
        }
      }

      if (match) {
        chavesVotosCasadas.add(match.chave);
      } else {
        semVotos.push({ id, nome });
      }

      const termosSet = new Set<string>();
      if (nomeNormalizado) termosSet.add(nomeNormalizado);
      for (const alias of ALIASES_MUNICIPIOS_MG[nomeNormalizado] || []) {
        termosSet.add(alias);
      }
      if (match?.dados?.nome) {
        const nomeDadosNorm = normalizarTexto(match.dados.nome);
        if (nomeDadosNorm) termosSet.add(nomeDadosNorm);
      }

      const item: MunicipioIndexado = {
        id,
        nome: nome || match?.dados?.nome || id,
        nomeNormalizado,
        termosBusca: Array.from(termosSet),
        dados: match?.dados,
      };

      listaIndex.push(item);
      mapaPorId[id] = item;
    });

    const votosNaoCasados = Object.entries(votosPorCidade)
      .filter(([chave]) => !chavesVotosCasadas.has(chave))
      .map(([chave, dados]) => ({ chave, nome: dados.nome }));

    return {
      geoCorrigido: geo,
      municipiosIndex: listaIndex,
      municipiosPorId: mapaPorId,
      votosSemCorrespondencia: votosNaoCasados,
      municipiosSemVotos: semVotos,
    };
  }, []);

  useEffect(() => {
    if (__DEV__) {
      console.log(
        `[Mapa MG] Municípios no GeoJSON: ${municipiosIndex.length} | Sem dados de votos: ${municipiosSemVotos.length} | Registros de votos sem cidade no mapa: ${votosSemCorrespondencia.length}`
      );
      if (municipiosSemVotos.length > 0) {
        console.warn('[Mapa MG] Municípios do mapa sem correspondência:', municipiosSemVotos);
      }
      if (votosSemCorrespondencia.length > 0) {
        console.warn(
          '[Mapa MG] Registros de votos sem correspondência no mapa:',
          votosSemCorrespondencia
        );
      }
    }
  }, [municipiosIndex.length, municipiosSemVotos, votosSemCorrespondencia]);

  const { municipiosPaths, legendaPartidos } = useMemo(() => {
    const projection = geoMercator().fitSize([larguraMapa, alturaMapa], geoCorrigido);
    const pathGenerator = geoPath().projection(projection);
    const contagemPartidos: Record<string, number> = {};

    const paths = (geoCorrigido.features || []).map((feature: any, index: number) => {
      const id = obterCodigoIbgeFeature(feature, index);
      const municipio = municipiosPorId[id];
      const dados = municipio?.dados;

      const listaCargo =
        dados && dados[cargoSelecionado]?.length > 0
          ? dados[cargoSelecionado]
          : cargoSelecionado === 'presidente'
            ? presidentesApi
            : [];

      const vencedor = listaCargo[0];
      const partido = vencedor?.partido?.toUpperCase() || '';

      if (partido) {
        contagemPartidos[partido] = (contagemPartidos[partido] || 0) + 1;
      }

      const cor = partido ? CORES_PARTIDO[partido] || '#64748B' : '#CBD5E1';

      return {
        id,
        d: pathGenerator(feature) || '',
        cor,
      };
    });

    const legenda = Object.entries(contagemPartidos)
      .sort((a, b) => b[1] - a[1])
      .map(([partido, totalCidades]) => ({
        partido,
        totalCidades,
        cor: CORES_PARTIDO[partido] || '#64748B',
      }));

    return { municipiosPaths: paths, legendaPartidos: legenda };
  }, [geoCorrigido, municipiosPorId, cargoSelecionado, larguraMapa, alturaMapa, presidentesApi]);

  const sugestoesCidades = useMemo(() => {
    const termo = normalizarTexto(busca);
    if (termo.length < 2) return [];
    return municipiosIndex
      .filter(
        (mun) =>
          mun.id.includes(termo) || mun.termosBusca.some((t) => t.includes(termo))
      )
      .slice(0, 6);
  }, [busca, municipiosIndex]);

  const municipioAtual = municipiosPorId[cidadeSelecionadaId];
  const dadosCidadeAtual = municipioAtual?.dados;
  const rankingBruto = dadosCidadeAtual?.[cargoSelecionado] || [];
  const usandoTotalEstadualPresidente =
    cargoSelecionado === 'presidente' && rankingBruto.length === 0;
  const rankingAtual = usandoTotalEstadualPresidente ? presidentesApi : rankingBruto;

  // Calcula o viewBox dinâmico com base no zoom e arraste
  const vbWidth = larguraMapa / camera.scale;
  const vbHeight = alturaMapa / camera.scale;
  const vbX = (larguraMapa - vbWidth) / 2 - camera.x / camera.scale;
  const vbY = (alturaMapa - vbHeight) / 2 - camera.y / camera.scale;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!interagindoMapa}
    >
      {/* Barra de busca por município */}
      <View style={styles.buscaContainer}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          style={styles.inputBusca}
          placeholder="Buscar entre os 853 municípios de MG..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {sugestoesCidades.length > 0 && (
        <View style={styles.listaSugestoes}>
          {sugestoesCidades.map((mun) => (
            <TouchableOpacity
              key={mun.id}
              style={styles.itemSugestao}
              onPress={() => {
                setCidadeSelecionadaId(mun.id);
                setBusca('');
              }}
            >
              <Ionicons name="location-outline" size={16} color="#C8102E" />
              <Text style={styles.textoSugestao}>{mun.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filtro de Cargo */}
      <View style={styles.filtrosRow}>
        {(['governador', 'presidente', 'senador'] as CargoMapa[]).map((cargo) => {
          const ativo = cargoSelecionado === cargo;
          return (
            <TouchableOpacity
              key={cargo}
              style={[styles.chip, ativo && styles.chipAtivo]}
              onPress={() => setCargoSelecionado(cargo)}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                {cargo.charAt(0).toUpperCase() + cargo.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mapa SVG Interativo com Zoom e Pinça */}
      <View style={styles.mapaCard}>
        <View
          style={{ width: larguraMapa, height: alturaMapa, overflow: 'hidden' }}
          {...panHandlers}
        >
          <Svg
            width={larguraMapa}
            height={alturaMapa}
            viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
          >
            <G>
              {municipiosPaths.map((mun: any) => {
                const selecionada = mun.id === cidadeSelecionadaId;
                return (
                  <Path
                    key={mun.id}
                    d={mun.d}
                    fill={selecionada ? '#FACC15' : mun.cor}
                    stroke={selecionada ? '#111827' : '#FFFFFF'}
                    strokeWidth={(selecionada ? 1.5 : 0.35) / Math.sqrt(camera.scale)}
                    onPress={() => {
                      setCidadeSelecionadaId(mun.id);
                    }}
                  />
                );
              })}
            </G>
          </Svg>

          {/* Controles flutuantes de Zoom (+, - e Reset) */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => aplicarZoomBotao(1.6)}
            >
              <Ionicons name="add" size={20} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => aplicarZoomBotao(0.625)}
            >
              <Ionicons name="remove" size={20} color="#111827" />
            </TouchableOpacity>
            {camera.scale > 1 && (
              <TouchableOpacity style={styles.zoomBtn} onPress={resetarZoom}>
                <Ionicons name="contract-outline" size={18} color="#C8102E" />
              </TouchableOpacity>
            )}
          </View>

          {camera.scale === 1 && (
            <View style={styles.dicaZoomBadge}>
              <Text style={styles.dicaZoomTexto}>Use 2 dedos ou + para dar zoom</Text>
            </View>
          )}
        </View>

        {/* Legenda dos partidos vencedores nos municípios */}
        <View style={styles.legendaContainer}>
          {legendaPartidos.map((item) => (
            <View key={item.partido} style={styles.legendaItem}>
              <View style={[styles.legendaBolinha, { backgroundColor: item.cor }]} />
              <Text style={styles.legendaTexto}>
                {item.partido} ({item.totalCidades})
              </Text>
            </View>
          ))}
          <View style={styles.legendaItem}>
            <View style={[styles.legendaBolinha, { backgroundColor: '#FACC15' }]} />
            <Text style={styles.legendaTexto}>Selecionada</Text>
          </View>
        </View>
      </View>

      {/* Atalhos rápidos para polos regionais */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.atalhosScroll}
        contentContainerStyle={styles.atalhosContent}
      >
        {CIDADES_DESTAQUE_IBGE.map((ibge) => {
          const mun = municipiosPorId[ibge];
          if (!mun) return null;
          const ativo = cidadeSelecionadaId === ibge;
          return (
            <TouchableOpacity
              key={ibge}
              style={[styles.atalhoChip, ativo && styles.atalhoChipAtivo]}
              onPress={() => setCidadeSelecionadaId(ibge)}
            >
              <Text style={[styles.atalhoTexto, ativo && styles.atalhoTextoAtivo]}>
                {mun.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Card de resultado da cidade selecionada */}
      {municipioAtual && (
        <View style={styles.resultadoCard}>
          <View style={styles.resultadoHeader}>
            <Ionicons name="location" size={20} color="#C8102E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cidadeTitulo}>{municipioAtual.nome}</Text>
              <Text style={styles.cidadeSubtitulo}>
                {usandoTotalEstadualPresidente
                  ? 'Resultado consolidado para PRESIDENTE (1º Turno)'
                  : `Mais votados para ${cargoSelecionado.toUpperCase()}`}
              </Text>
            </View>
          </View>

          {rankingAtual.map((cand, idx) => (
            <View key={cand.numero} style={styles.linhaCandidato}>
              <View style={[styles.posicaoBadge, idx === 0 && styles.posicaoBadgePrimeiro]}>
                <Text style={[styles.posicaoTexto, idx === 0 && styles.posicaoTextoPrimeiro]}>
                  {idx + 1}º
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.candNome}>{cand.nome}</Text>
                <Text style={styles.candPartido}>
                  {cand.partido} • Nº {cand.numero}
                </Text>
              </View>
              <Text style={styles.candVotos}>
                {cand.votos.toLocaleString('pt-BR')} votos
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputBusca: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  listaSugestoes: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  itemSugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  textoSugestao: { fontSize: 14, color: '#111827', fontWeight: '500' },
  filtrosRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipAtivo: { backgroundColor: '#C8102E', borderColor: '#C8102E' },
  chipTexto: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextoAtivo: { color: '#FFFFFF' },
  mapaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  zoomControls: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    gap: 6,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  dicaZoomBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dicaZoomTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  legendaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    width: '100%',
  },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendaBolinha: { width: 10, height: 10, borderRadius: 5 },
  legendaTexto: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  atalhosScroll: { marginTop: 12 },
  atalhosContent: { gap: 8 },
  atalhoChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  atalhoChipAtivo: { backgroundColor: '#111827', borderColor: '#111827' },
  atalhoTexto: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  atalhoTextoAtivo: { color: '#FFFFFF' },
  resultadoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cidadeTitulo: { fontSize: 17, fontWeight: '800', color: '#111827' },
  cidadeSubtitulo: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  linhaCandidato: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  posicaoBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posicaoBadgePrimeiro: { backgroundColor: '#FEF2F2' },
  posicaoTexto: { fontSize: 12, fontWeight: '800', color: '#4B5563' },
  posicaoTextoPrimeiro: { color: '#C8102E' },
  candNome: { fontSize: 14, fontWeight: '700', color: '#111827' },
  candPartido: { fontSize: 12, color: '#6B7280' },
  candVotos: { fontSize: 13, fontWeight: '700', color: '#111827' },
});