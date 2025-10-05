import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Modal, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import axios from 'axios';
import { NEWS_BASE } from './config/api';

interface FileItem {
  id: string;
  title: string;
  description: string;
  fileName: string;
}

type ApiNewsItem = {
  id: number;
  title: string;
  content: string;
  documentUrl?: string | null;
  documentName?: string | null;
};

const screenWidth = Dimensions.get('window').width;

export default function FileListScreen() {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const mapApiToFileItems = (list: ApiNewsItem[]): FileItem[] =>
    list.map((n) => ({
      id: String(n.id),
      title: n.title,
      description: n.content,
      fileName: n.documentName || n.documentUrl || 'N/A',
    }));

  const loadNews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${NEWS_BASE}`);
      // Backend success format: { success, message, data }
      const data = res?.data?.data || [];
      setItems(mapApiToFileItems(data));
    } catch (e) {
      // Fallback to empty list on error
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const openViewModal = (item: FileItem) => {
    setSelectedFile(item);
    setModalVisible(true);
  };

  const closeViewModal = () => {
    setModalVisible(false);
    setSelectedFile(null);
  };

  const renderItem = ({ item }: { item: FileItem }) => (
    <Card style={styles.card} elevation={4}>
      <Card.Content>
        <Text style={styles.title}>{item.title}</Text>
        {/* Truncated description here */}
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
      </Card.Content>
      <Card.Actions style={styles.actionsContainer}>
        <Button
          mode="outlined"
          icon="eye"
          onPress={() => openViewModal(item)}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          View
        </Button>
        <Button
          mode="contained"
          icon="download"
          onPress={() => { /* placeholder for download */ }}
          style={[styles.button, styles.downloadButton]}
          labelStyle={[styles.buttonLabel, styles.downloadButtonLabel]}
        >
          Download
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNews} />}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeViewModal}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: screenWidth - 40 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedFile?.title}
              </Text>
            </View>

            <ScrollView>
              {/* Full description here */}
              <Text style={styles.modalDescription}>{selectedFile?.description}</Text>
              <Text style={styles.modalFileName}>File: {selectedFile?.fileName}</Text>

              <Button mode="contained" onPress={closeViewModal} style={styles.closeButton}>
                Close
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 110,
    marginLeft: 12,
    borderRadius: 8,
  },
  downloadButton: {
    backgroundColor: '#007BFF',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButtonLabel: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    maxHeight: '80%',
    width: '100%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    flexShrink: 1,
  },
  modalDescription: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalFileName: {
    fontSize: 14,
    color: '#777',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  closeButton: {
    borderRadius: 8,
  },
});
