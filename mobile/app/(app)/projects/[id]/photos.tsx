import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getPhotos } from '../../../../lib/api';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Colors } from '../../../../constants/colors';
import type { ProjectPhoto } from '../../../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - 40 - 8) / 3;

export default function PhotosScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<ProjectPhoto | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getPhotos(projectId);
      setPhotos(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      Alert.alert(
        `${result.assets.length} photo${result.assets.length > 1 ? 's' : ''} selected`,
        'Photo upload to the server is coming soon. Photos are selected and ready.',
      );
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Photos',
          headerRight: () => (
            <TouchableOpacity onPress={handleAddPhoto} style={{ marginRight: 4 }}>
              <Ionicons name="add-circle-outline" size={26} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.root}>
        <FlatList
          data={photos}
          keyExtractor={(p) => p.id}
          numColumns={3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelected(item)} style={styles.thumb}>
              <Image source={{ uri: item.url }} style={styles.thumbImg} resizeMode="cover" />
            </TouchableOpacity>
          )}
          columnWrapperStyle={{ gap: 4 }}
          contentContainerStyle={styles.grid}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          ListEmptyComponent={
            <EmptyState
              title="No Photos"
              message="Tap + to add photos from your library."
            />
          }
        />

        {/* Lightbox */}
        <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <View style={styles.lightbox}>
            <TouchableOpacity style={styles.lightboxClose} onPress={() => setSelected(null)}>
              <Ionicons name="close-circle" size={36} color={Colors.white} />
            </TouchableOpacity>
            {selected && (
              <>
                <Image source={{ uri: selected.url }} style={styles.lightboxImg} resizeMode="contain" />
                {selected.caption && (
                  <View style={styles.lightboxCaption}>
                    <Text style={styles.lightboxCaptionText}>{selected.caption}</Text>
                  </View>
                )}
                <Text style={styles.lightboxDate}>
                  {new Date(selected.created_at).toLocaleDateString()}
                  {selected.uploader_name ? ` · ${selected.uploader_name}` : ''}
                </Text>
              </>
            )}
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  grid: { padding: 16, flexGrow: 1 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  thumbImg: { width: '100%', height: '100%' },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  lightboxImg: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 },
  lightboxCaption: { marginTop: 16, paddingHorizontal: 24 },
  lightboxCaptionText: { color: Colors.white, fontSize: 14, textAlign: 'center' },
  lightboxDate: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
});
