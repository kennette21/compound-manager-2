import { useState, useRef, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Photo } from '../../types';

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, []);

  const currentPhoto = photos[currentIndex];

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPhoto = useCallback(
    ({ item }: { item: Photo }) => (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.url }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Image Carousel - render first so it's behind */}
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderPhoto}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={styles.flatList}
      />

      {/* Header - render after FlatList to be on top */}
      <View style={styles.header} pointerEvents="box-none">
        <SafeAreaView edges={['top']} style={styles.headerInner} pointerEvents="box-none">
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>
            {currentIndex + 1} / {photos.length}
          </Text>
          <View style={styles.placeholder} />
        </SafeAreaView>
      </View>

      {/* Footer - render after FlatList to be on top */}
      <View style={styles.footer} pointerEvents="box-none">
        <SafeAreaView edges={['bottom']} style={styles.footerInner}>
          <Text style={styles.dateText}>
            {formatDate(currentPhoto.captured_at)}
          </Text>
          {currentPhoto.photo_type && currentPhoto.photo_type !== 'general' && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {currentPhoto.photo_type.charAt(0).toUpperCase() +
                  currentPhoto.photo_type.slice(1)}
              </Text>
            </View>
          )}
          {currentPhoto.notes && (
            <Text style={styles.notes}>{currentPhoto.notes}</Text>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flatList: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    width: 44,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerInner: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    gap: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#4f46e5',
    borderRadius: 6,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  notes: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});
