import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, View } from 'react-native';

interface ImageWithFallbackProps {
  source: { uri: string };
  style: any;
  type?: 'poster' | 'cast' | 'backdrop';
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  source, 
  style, 
  type = 'poster' 
}) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError || !source.uri) {
    const getIconSize = () => {
      switch (type) {
        case 'cast': return 20;
        case 'backdrop': return 24;
        default: return 32;
      }
    };

    const getIconName = () => {
      switch (type) {
        case 'cast': return 'person-outline';
        default: return 'film-outline';
      }
    };

    return (
      <View style={[style, { 
        backgroundColor: '#2a2a2a', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }]}>
        <Ionicons 
          name={getIconName()} 
          size={getIconSize()} 
          color="#666" 
        />
      </View>
    );
  }
  
  return (
    <Image
      source={source}
      style={style}
      onError={() => setImageError(true)}
    />
  );
};