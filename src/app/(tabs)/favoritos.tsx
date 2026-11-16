import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '@/services/storage';
import { Candidato, Cargo } from '@/types/candidato';
import { CandidateCard } from '@/components/CandidateCard';

export default function TelaFavoritos() {
  const [listaCola, setListaCola] = useState<Candidato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroCargo, setFiltroCargo] = useState<Cargo | 'Todos'>('Todos');

  const carregarCola = async () => {
    try {
      const itens = await storageService.getFavoritos();
      setListaCola(itens);
    } catch {
      console.log('Erro ao buscar cola');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarCola();
    }, [])
  );

  const removerCandidato = async (id: string) => {
    try {
      await storageService.removerFavorito(id);
      setListaCola((prev) => prev.filter((c) => c.id !== id));
    } catch {
      Alert.alert('Erro', 'Não foi possível remover da cola.');
    }
  };

  const limparCola = () => {
    Alert.alert(
      'Limpar Minha Cola',
      'Deseja apagar todos os candidatos salvos na sua cola?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: async () => {
            await storageService.limparFavoritos();
            setListaCola([]);
          },
        },
      ]
    );
  };

  const candidatosFiltrados = listaCola.filter((c) => {
    if (filtroCargo === 'Todos') return true;
    return c.cargo === filtroCargo;
  });

  if (carregando) {
    return (
      <SafeAreaView style={styles.telaCentro}>
        <ActivityIndicator size="large" color="#C8102E" />
        <Text style={styles.txtCarregando}>Carregando sua cola...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {listaCola.length === 0 ? (
        <View style={styles.caixaVazia}>
          <View style={styles.bolaIconeVazio}>
            <Ionicons name="clipboard-outline" size={48} color="#C8102E" />
          </View>
          <Text style={styles.tituloVazio}>Sua Minha Cola está vazia!</Text>
          <Text style={styles.descVazio}>
            Navegue pelos candidatos de Minas Gerais e toque em &ldquo;Salvar na Minha Cola&rdquo; para deixar seus escolhidos salvos offline.
          </Text>
          <TouchableOpacity
            style={styles.btnExplorar}
            onPress={() => router.push('/(tabs)/candidatos')}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={16} color="#FFFFFF" />
            <Text style={styles.txtBtnExplorar}>Explorar Candidatos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.topoAcoes}>
            <View>
              <Text style={styles.tituloCola}>Minha Cola ({listaCola.length})</Text>
              <Text style={styles.subtituloCola}>Candidatos salvos offline no aparelho</Text>
            </View>

            <View style={styles.linhaBotoes}>
              <TouchableOpacity
                style={styles.btnTreinarUrna}
                onPress={() => router.push('/(tabs)/urna')}
                activeOpacity={0.8}
              >
                <Ionicons name="calculator-outline" size={15} color="#FFFFFF" />
                <Text style={styles.txtBtnTreinar}>Ir para Urna</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnLimpar} onPress={limparCola} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={styles.txtBtnLimpar}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.secaoFiltro}>
            <Text style={styles.rotuloFiltro}>Filtrar Cargo:</Text>
            <View style={styles.linhaChips}>
              {(['Todos', 'Governador', 'Senador', 'Deputado Federal'] as const).map((item) => {
                const ativo = filtroCargo === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => setFiltroCargo(item)}
                  >
                    <Text style={[styles.txtChip, ativo && styles.txtChipAtivo]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <FlatList
            data={candidatosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CandidateCard
                candidato={item}
                onRemover={removerCandidato}
                salvo={true}
              />
            )}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <View style={styles.avisoSemFiltro}>
                <Text style={styles.txtSemFiltro}>
                  Nenhum candidato salvo para o cargo selecionado ({filtroCargo}).
                </Text>
              </View>
            }
          />
        </>
      )}
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
  },
  txtCarregando: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  caixaVazia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  bolaIconeVazio: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tituloVazio: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  descVazio: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 19,
    maxWidth: 280,
  },
  btnExplorar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C8102E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  txtBtnExplorar: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  topoAcoes: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tituloCola: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  subtituloCola: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btnTreinarUrna: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  txtBtnTreinar: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11.5,
  },
  btnLimpar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  txtBtnLimpar: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 11.5,
  },
  secaoFiltro: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rotuloFiltro: {
    fontSize: 10.5,
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
    borderRadius: 12,
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
  lista: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  avisoSemFiltro: {
    padding: 24,
    alignItems: 'center',
  },
  txtSemFiltro: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
  },
});
