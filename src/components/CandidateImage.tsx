import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface CandidateImageProps {
  uri?: ImageSourcePropType | string;
  nome: string;
  size?: number;
  width?: number;
  height?: number;
  circular?: boolean;
  borderRadius?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  borderColor?: string;
  borderWidth?: number;
}

// Extrai até duas iniciais representativas do nome do candidato
export const extrairIniciais = (nome: string): string => {
  if (!nome || typeof nome !== 'string') return 'C';
  const limpo = nome
    .trim()
    .toUpperCase()
    .replace(/^(DR\.|DRA\.|PROF\.|PROFA\.|DEPUTADO FEDERAL|DEPUTADA FEDERAL|DEPUTADO ESTADUAL|DEPUTADA ESTADUAL|DEPUTADO|DEPUTADA|CORONEL|PASTOR|PASTORA|PADRE|SARGENTO)\s+/i, '')
    .trim();

  const partes = limpo.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'C';
  if (partes.length === 1) {
    return partes[0].slice(0, 2);
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const USER_AGENT_PADRAO =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const CandidateImage: React.FC<CandidateImageProps> = ({
  uri,
  nome,
  size = 64,
  width,
  height,
  circular = true,
  borderRadius,
  style,
  containerStyle,
  borderColor,
  borderWidth = 0,
}) => {
  const finalWidth = width || size;
  const finalHeight = height || size;
  const finalBorderRadius =
    borderRadius !== undefined
      ? borderRadius
      : circular
        ? Math.min(finalWidth, finalHeight) / 2
        : 6;

  const [itemComFalha, setItemComFalha] = useState<ImageSourcePropType | string | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);

  const ehString = typeof uri === 'string';
  const ehAssetLocal = Boolean(uri && !ehString);
  const temFonteValida = ehAssetLocal || (ehString && uri.trim() !== '');
  const falhou = !temFonteValida || itemComFalha === uri;

  const iniciais = extrairIniciais(nome);
  const tamanhoFonte = Math.max(10, Math.round(Math.min(finalWidth, finalHeight) * 0.38));

  const dimensoesContainer: ViewStyle = {
    width: finalWidth,
    height: finalHeight,
    borderRadius: finalBorderRadius,
    overflow: 'hidden',
    borderWidth: borderWidth,
    borderColor: borderColor || 'transparent',
  };

  if (falhou || !uri) {
    return (
      <View
        style={[
          styles.containerFallback,
          dimensoesContainer,
          containerStyle,
        ]}
      >
        <Text style={[styles.textoIniciais, { fontSize: tamanhoFonte }]}>
          {iniciais}
        </Text>
      </View>
    );
  }

  // Monta o source corretamente: direto para asset local (require) ou com headers para URL http
  const imageSource: ImageSourcePropType = ehString
    ? {
        uri,
        headers: {
          'User-Agent': USER_AGENT_PADRAO,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      }
    : uri;

  return (
    <View style={[styles.containerBase, dimensoesContainer, containerStyle]}>
      {carregando && !ehAssetLocal && (
        <View style={[StyleSheet.absoluteFill, styles.loadingPlaceholder]}>
          <ActivityIndicator size="small" color="#C8102E" />
        </View>
      )}

      <Image
        source={imageSource}
        style={[
          {
            width: finalWidth,
            height: finalHeight,
            borderRadius: finalBorderRadius,
          },
          style,
        ]}
        resizeMode="cover"
        onLoadStart={() => {
          if (!ehAssetLocal) setCarregando(true);
        }}
        onLoadEnd={() => setCarregando(false)}
        onError={() => {
          setCarregando(false);
          setItemComFalha(uri);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerFallback: {
    backgroundColor: '#C8102E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoIniciais: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
});