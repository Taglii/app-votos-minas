import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { storageService } from '@/services/storage';
import { Candidato, Cargo, VotoUrnaRegistro } from '@/types/candidato';
import { UrnaTeclado } from '@/components/UrnaTeclado';

const CONFIG_CARGO: Record<Cargo, { digitos: number; titulo: string }> = {
  Governador: { digitos: 2, titulo: 'GOVERNADOR' },
  Senador: { digitos: 3, titulo: 'SENADOR' },
  'Deputado Federal': { digitos: 4, titulo: 'DEPUTADO FEDERAL' },
};

export default function TelaUrna() {
  const params = useLocalSearchParams<{ prefillNumero?: string; cargo?: Cargo }>();

  const [cargo, setCargo] = useState<Cargo>(() => {
    if (params.cargo && ['Governador', 'Senador', 'Deputado Federal'].includes(params.cargo)) {
      return params.cargo;
    }
    return 'Governador';
  });
  const [digitos, setDigitos] = useState<string>(() => params.prefillNumero || '');
  const [votouEmBranco, setVotouEmBranco] = useState(false);
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [telaFim, setTelaFim] = useState(false);
  const [totalVotos, setTotalVotos] = useState(0);

  const qtdDigitos = CONFIG_CARGO[cargo].digitos;

  useEffect(() => {
    let ativo = true;

    storageService.getTotalVotosSimulados().then((total) => {
      if (ativo) setTotalVotos(total);
    });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    const checarNumero = async () => {
      if (votouEmBranco || digitos.length < qtdDigitos) {
        setCandidato(null);
        return;
      }

      const match = await api.getCandidatoByNumero(digitos, cargo);
      if (ativo) {
        setCandidato(match);
      }
    };

    checarNumero();

    return () => {
      ativo = false;
    };
  }, [digitos, cargo, votouEmBranco, qtdDigitos]);

  const tocarSinalUrna = () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.setValueAtTime(1400, ctx.currentTime + 0.12);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }
      } else {
        Vibration.vibrate([0, 80, 40, 200]);
      }
    } catch {
      // ignora se a plataforma não permitir som/vibração
    }
  };

  const digitar = (num: string) => {
    if (telaFim) return;
    try {
      Vibration.vibrate(20);
    } catch {
      // continua normal
    }
    if (votouEmBranco) {
      setVotouEmBranco(false);
    }
    if (digitos.length < qtdDigitos) {
      setDigitos((prev) => prev + num);
    }
  };

  const votarEmBranco = () => {
    if (telaFim) return;
    if (digitos.length > 0) {
      Alert.alert(
        'Atenção',
        'Para votar em BRANCO não pode haver números digitados. Aperte CORRIGE primeiro.'
      );
      return;
    }
    setVotouEmBranco(true);
    setCandidato(null);
  };

  const corrigir = () => {
    if (telaFim) return;
    setDigitos('');
    setVotouEmBranco(false);
    setCandidato(null);
  };

  const confirmar = async () => {
    if (telaFim) return;

    if (!votouEmBranco && digitos.length < qtdDigitos) {
      Alert.alert(
        'Voto incompleto',
        `Digite os ${qtdDigitos} dígitos para ${CONFIG_CARGO[cargo].titulo} ou aperte BRANCO.`
      );
      return;
    }

    try {
      let registro: VotoUrnaRegistro;

      if (votouEmBranco) {
        registro = {
          numero: 'BRANCO',
          tipo: 'branco',
          cargo,
          timestamp: Date.now(),
        };
      } else if (candidato) {
        registro = {
          candidatoId: candidato.id,
          numero: digitos,
          tipo: 'nominal',
          cargo,
          timestamp: Date.now(),
        };
      } else {
        registro = {
          numero: digitos,
          tipo: 'nulo',
          cargo,
          timestamp: Date.now(),
        };
      }

      await storageService.registrarVoto(registro);
      const novoTotal = await storageService.getTotalVotosSimulados();
      setTotalVotos(novoTotal);

      tocarSinalUrna();
      setTelaFim(true);

      // Reinicia visor apos 3.5 segundos
      setTimeout(() => {
        setTelaFim(false);
        setDigitos('');
        setVotouEmBranco(false);
        setCandidato(null);
      }, 3500);
    } catch {
      Alert.alert('Erro', 'Não foi possível gravar o voto na urna.');
    }
  };

  const trocarCargo = (novoCargo: Cargo) => {
    setCargo(novoCargo);
    setDigitos('');
    setVotouEmBranco(false);
    setCandidato(null);
  };

  const zerarUrna = () => {
    Alert.alert(
      'Zerar Urna (Zerésima)',
      'Deseja zerar todos os votos simulados gravados no aparelho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Zerar',
          style: 'destructive',
          onPress: async () => {
            await storageService.zerarUrna();
            setTotalVotos(0);
          },
        },
      ]
    );
  };

  const numeroCompleto = digitos.length === qtdDigitos;
  const ehNulo = numeroCompleto && !candidato && !votouEmBranco;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.seletorCargos}>
          <Text style={styles.rotuloSeletor}>Escolha o Cargo:</Text>
          <View style={styles.linhaBotoesCargo}>
            {(['Governador', 'Senador', 'Deputado Federal'] as const).map((item) => {
              const ativo = cargo === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.btnCargo, ativo && styles.btnCargoAtivo]}
                  onPress={() => trocarCargo(item)}
                  disabled={telaFim}
                >
                  <Text style={[styles.txtBtnCargo, ativo && styles.txtBtnCargoAtivo]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.visorUrna}>
          {telaFim ? (
            <View style={styles.telaFimContainer}>
              <Text style={styles.txtFim}>FIM</Text>
              <Text style={styles.txtGravado}>VOTO GRAVADO</Text>
              <View style={styles.badgeSom}>
                <Ionicons name="volume-high" size={18} color="#15803D" />
                <Text style={styles.txtSom}>* PILILILI! *</Text>
              </View>
              <TouchableOpacity
                style={styles.btnReiniciar}
                onPress={() => {
                  setTelaFim(false);
                  setDigitos('');
                  setVotouEmBranco(false);
                  setCandidato(null);
                }}
              >
                <Text style={styles.txtReiniciar}>Próximo Eleitor</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.conteudoVisor}>
              <View style={styles.topoVisor}>
                <Text style={styles.txtSeuVoto}>SEU VOTO PARA</Text>
                <Text style={styles.txtNomeCargo}>{CONFIG_CARGO[cargo].titulo}</Text>
              </View>

              {votouEmBranco ? (
                <View style={styles.caixaBranco}>
                  <Text style={styles.txtVotoBranco}>VOTO EM BRANCO</Text>
                </View>
              ) : (
                <View style={styles.corpoVisor}>
                  <View style={styles.colunaDigitos}>
                    <Text style={styles.rotuloNumero}>Número:</Text>
                    <View style={styles.gradeCaixas}>
                      {Array.from({ length: qtdDigitos }).map((_, i) => {
                        const digito = digitos[i] || '';
                        const estaFocada = i === digitos.length;
                        return (
                          <View
                            key={i}
                            style={[styles.caixa, estaFocada && styles.caixaFocada]}
                          >
                            <Text style={styles.txtDigito}>{digito}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {candidato && (
                      <View style={styles.dadosCandidato}>
                        <Text style={styles.nomeNaUrna}>Nome: {candidato.nome}</Text>
                        <Text style={styles.partidoNaUrna}>Partido: {candidato.partido}</Text>
                        {candidato.viceOuSuplente && (
                          <Text style={styles.viceNaUrna}>{candidato.viceOuSuplente}</Text>
                        )}
                      </View>
                    )}

                    {ehNulo && (
                      <View style={styles.avisoNulo}>
                        <Text style={styles.txtNumeroErrado}>NÚMERO ERRADO</Text>
                        <Text style={styles.txtVotoNulo}>VOTO NULO</Text>
                      </View>
                    )}
                  </View>

                  {candidato && (
                    <View style={styles.fotoContainer}>
                      <Image source={{ uri: candidato.foto }} style={styles.fotoUrna} resizeMode="cover" />
                      <Text style={styles.legendaFoto}>
                        {candidato.cargo === 'Governador' ? 'GOV' : 'CAND'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.rodapeVisor}>
                <Text style={styles.instrucaoTopo}>Aperte a tecla:</Text>
                <Text style={styles.instrucaoVerde}>VERDE para CONFIRMAR</Text>
                <Text style={styles.instrucaoLaranja}>LARANJA para REINICIAR</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.areaTeclado}>
          <UrnaTeclado
            onNumero={digitar}
            onBranco={votarEmBranco}
            onCorrige={corrigir}
            onConfirma={confirmar}
            desabilitado={telaFim}
          />
        </View>

        <View style={styles.cardArmazenamento}>
          <View style={styles.linhaInfoStorage}>
            <View style={styles.iconeETexto}>
              <Ionicons name="server-outline" size={16} color="#C8102E" />
              <Text style={styles.tituloStorage}>Memória da Urna (AsyncStorage)</Text>
            </View>
            <TouchableOpacity onPress={zerarUrna} style={styles.btnZerar}>
              <Text style={styles.txtZerar}>Zerar Urna</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.textoTotalVotos}>
            Total de votos computados nesta simulação: <Text style={styles.destaqueTotal}>{totalVotos}</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  scroll: {
    padding: 14,
    paddingBottom: 28,
  },
  seletorCargos: {
    marginBottom: 10,
  },
  rotuloSeletor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  linhaBotoesCargo: {
    flexDirection: 'row',
    gap: 6,
  },
  btnCargo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnCargoAtivo: {
    backgroundColor: '#C8102E',
    borderColor: '#C8102E',
  },
  txtBtnCargo: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  txtBtnCargoAtivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  visorUrna: {
    backgroundColor: '#FAFDF9',
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#4B5563',
    minHeight: 260,
    padding: 12,
    marginBottom: 14,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  conteudoVisor: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topoVisor: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingBottom: 4,
    marginBottom: 8,
  },
  txtSeuVoto: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '700',
    letterSpacing: 1,
  },
  txtNomeCargo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  corpoVisor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  colunaDigitos: {
    flex: 1,
    paddingRight: 6,
  },
  rotuloNumero: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 4,
  },
  gradeCaixas: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  caixa: {
    width: 34,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caixaFocada: {
    borderColor: '#111827',
    borderWidth: 2,
  },
  txtDigito: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  dadosCandidato: {
    marginTop: 4,
    backgroundColor: '#F0FDF4',
    padding: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  nomeNaUrna: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  partidoNaUrna: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  viceNaUrna: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  avisoNulo: {
    marginTop: 6,
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  txtNumeroErrado: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  txtVotoNulo: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991B1B',
    marginTop: 2,
  },
  fotoContainer: {
    width: 76,
    alignItems: 'center',
  },
  fotoUrna: {
    width: 72,
    height: 86,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    backgroundColor: '#E5E7EB',
  },
  legendaFoto: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 2,
  },
  caixaBranco: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  txtVotoBranco: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 1.2,
  },
  rodapeVisor: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 6,
    marginTop: 8,
  },
  instrucaoTopo: {
    fontSize: 9,
    color: '#6B7280',
  },
  instrucaoVerde: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
  },
  instrucaoLaranja: {
    fontSize: 10,
    color: '#C2410C',
    fontWeight: '700',
  },
  telaFimContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  txtFim: {
    fontSize: 58,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 3,
  },
  txtGravado: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  badgeSom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 10,
  },
  txtSom: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  btnReiniciar: {
    marginTop: 14,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  txtReiniciar: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  areaTeclado: {
    marginBottom: 14,
  },
  cardArmazenamento: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  linhaInfoStorage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconeETexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloStorage: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#374151',
  },
  btnZerar: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  txtZerar: {
    fontSize: 10.5,
    color: '#DC2626',
    fontWeight: '700',
  },
  textoTotalVotos: {
    fontSize: 12,
    color: '#4B5563',
  },
  destaqueTotal: {
    fontWeight: '800',
    color: '#C8102E',
  },
});
