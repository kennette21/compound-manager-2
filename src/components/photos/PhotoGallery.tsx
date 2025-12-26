import { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
} from 'react-native';
import type { Photo } from '../../types';
import { PhotoViewer } from './PhotoViewer';

interface PhotoGalleryProps {
  photos: Photo[];
  columns?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PhotoGallery({ photos, columns = 3 }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const photoSize = (SCREEN_WIDTH - 32 - (columns - 1) * 4) / columns;

  const handlePhotoPress = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const renderPhoto = useCallback(
    ({ item, index }: { item: Photo; index: number }) => (
      <TouchableOpacity
        style={[styles.photoContainer, { width: photoSize, height: photoSize }]}
        onPress={() => handlePhotoPress(index)}
      >
        <Image
          source={{ uri: item.thumbnail_url || item.url }}
          style={styles.photo}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ),
    [photoSize, handlePhotoPress]
  );

  return (
    <>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderPhoto}
        numColumns={columns}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />

      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        {selectedIndex !== null && (
          <PhotoViewer
            photos={photos}
            initialIndex={selectedIndex}
            onClose={handleClose}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 4,
  },
  row: {
    gap: 4,
  },
  photoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
