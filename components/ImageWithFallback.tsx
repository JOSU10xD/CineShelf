import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ImageWithFallbackProps {
  source: { uri: string };
  style: any;
  type?: 'poster' | 'cast' | 'backdrop';
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  source,
  style,
  type = 'poster',
}) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getIconSize = () => {
    switch (type) {
      case 'cast':
        return 20;
      case 'backdrop':
        return 32;
      default:
        return 40;
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'cast':
        return 'person-outline';
      default:
        return 'film-outline';
    }
  };

  if (imageError || !source?.uri) {
    return (
      <View style={[style, styles.placeholder, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name={getIconName()} size={getIconSize()} color={theme.colors.border} />
      </View>
    );
  }

  return (
    <View style={[style, styles.container]}>
      <Image
        source={source}
        style={[style, !imageLoaded && styles.hidden]}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
        fadeDuration={300}
        resizeMode="cover"
      />
      {!imageLoaded && (
        <View style={[style, styles.loadingPlaceholder, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="image-outline" size={getIconSize()} color={theme.colors.border} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  loadingPlaceholder: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  hidden: {
    opacity: 0,
  },
});
