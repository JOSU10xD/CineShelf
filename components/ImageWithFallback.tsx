import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

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
      <View style={[style, styles.placeholder]}>
        <Ionicons name={getIconName()} size={getIconSize()} color="#333" />
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
        <View style={[style, styles.loadingPlaceholder]}>
          <Ionicons name="image-outline" size={getIconSize()} color="#333" />
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
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#252525',
  },
  loadingPlaceholder: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#252525',
  },
  hidden: {
    opacity: 0,
  },
});
