import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, CheckCircle, Clock, Plus, Trash2, Eye, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

type DocType = 'DL' | 'RC' | 'INS';

interface IdentityDocumentVaultProps {
  user: any;
  onUploadDoc: (type: DocType, name: string) => Promise<void>;
  onDeleteDoc: (type: DocType) => Promise<void>;
}

export default function IdentityDocumentVault({
  user,
  onUploadDoc,
  onDeleteDoc,
}: IdentityDocumentVaultProps) {
  const colors = useTheme();
  const [viewerDocType, setViewerDocType] = React.useState<DocType | null>(null);

  const getDocStatus = (type: DocType) => {
    if (!user || !user.documents) return 'Not Uploaded';
    const doc = user.documents.find((d: any) => d.type === type);
    return doc ? 'Uploaded' : 'Not Uploaded';
  };

  const getDoc = (type: DocType) => {
    if (!user || !user.documents) return null;
    return user.documents.find((d: any) => d.type === type);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
      {/* Driving License DL */}
      <View style={styles.vaultRow}>
        <TouchableOpacity
          activeOpacity={getDocStatus('DL') === 'Uploaded' ? 0.7 : 1.0}
          onPress={() => {
            if (getDocStatus('DL') === 'Uploaded') {
              setViewerDocType('DL');
            }
          }}
          style={styles.vaultRowTouchable}
        >
          <View style={styles.vaultIconContainer}>
            <FileText size={20} color="#00f2ff" />
          </View>
          <View style={styles.vaultDetails}>
            <Text style={[styles.vaultName, { color: colors.text }]}>Driving License (DL)</Text>
            {getDoc('DL') && (
              <Text style={[styles.customDocName, { color: colors.textSecondary }]}>
                {getDoc('DL').name}
              </Text>
            )}
            <View style={styles.vaultBadgeRow}>
              {getDocStatus('DL') === 'Uploaded' ? (
                <View style={styles.uploadedBadge}>
                  <CheckCircle size={10} color="#00cc6a" />
                  <Text style={styles.uploadedBadgeText}>Verified</Text>
                </View>
              ) : (
                <View style={[styles.missingBadge, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
                  <Clock size={10} color={colors.textSecondary} />
                  <Text style={[styles.missingBadgeText, { color: colors.textSecondary }]}>Not Uploaded</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {getDocStatus('DL') === 'Uploaded' ? (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              onPress={() => setViewerDocType('DL')}
              style={styles.viewVaultBtn}
            >
              <Eye size={16} color="#00f2ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeleteDoc('DL')}
              style={styles.deleteVaultBtn}
            >
              <Trash2 size={16} color="#ff4b4b" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onUploadDoc('DL', 'Driving License')}
            style={styles.uploadVaultBtn}
          >
            <Plus size={16} color="#00f2ff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.cardDivider, { backgroundColor: colors.borderGlass }]} />

      {/* Registration Certificate RC */}
      <View style={styles.vaultRow}>
        <TouchableOpacity
          activeOpacity={getDocStatus('RC') === 'Uploaded' ? 0.7 : 1.0}
          onPress={() => {
            if (getDocStatus('RC') === 'Uploaded') {
              setViewerDocType('RC');
            }
          }}
          style={styles.vaultRowTouchable}
        >
          <View style={styles.vaultIconContainer}>
            <FileText size={20} color="#00f2ff" />
          </View>
          <View style={styles.vaultDetails}>
            <Text style={[styles.vaultName, { color: colors.text }]}>Registration Certificate (RC)</Text>
            {getDoc('RC') && (
              <Text style={[styles.customDocName, { color: colors.textSecondary }]}>
                {getDoc('RC').name}
              </Text>
            )}
            <View style={styles.vaultBadgeRow}>
              {getDocStatus('RC') === 'Uploaded' ? (
                <View style={styles.uploadedBadge}>
                  <CheckCircle size={10} color="#00cc6a" />
                  <Text style={styles.uploadedBadgeText}>Verified</Text>
                </View>
              ) : (
                <View style={[styles.missingBadge, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
                  <Clock size={10} color={colors.textSecondary} />
                  <Text style={[styles.missingBadgeText, { color: colors.textSecondary }]}>Not Uploaded</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {getDocStatus('RC') === 'Uploaded' ? (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              onPress={() => setViewerDocType('RC')}
              style={styles.viewVaultBtn}
            >
              <Eye size={16} color="#00f2ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeleteDoc('RC')}
              style={styles.deleteVaultBtn}
            >
              <Trash2 size={16} color="#ff4b4b" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onUploadDoc('RC', 'Registration Book')}
            style={styles.uploadVaultBtn}
          >
            <Plus size={16} color="#00f2ff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.cardDivider, { backgroundColor: colors.borderGlass }]} />

      {/* Vehicle Insurance */}
      <View style={styles.vaultRow}>
        <TouchableOpacity
          activeOpacity={getDocStatus('INS') === 'Uploaded' ? 0.7 : 1.0}
          onPress={() => {
            if (getDocStatus('INS') === 'Uploaded') {
              setViewerDocType('INS');
            }
          }}
          style={styles.vaultRowTouchable}
        >
          <View style={styles.vaultIconContainer}>
            <FileText size={20} color="#00f2ff" />
          </View>
          <View style={styles.vaultDetails}>
            <Text style={[styles.vaultName, { color: colors.text }]}>Vehicle Insurance Policy</Text>
            {getDoc('INS') && (
              <Text style={[styles.customDocName, { color: colors.textSecondary }]}>
                {getDoc('INS').name}
              </Text>
            )}
            <View style={styles.vaultBadgeRow}>
              {getDocStatus('INS') === 'Uploaded' ? (
                <View style={styles.uploadedBadge}>
                  <CheckCircle size={10} color="#00cc6a" />
                  <Text style={styles.uploadedBadgeText}>Verified</Text>
                </View>
              ) : (
                <View style={[styles.missingBadge, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
                  <Clock size={10} color={colors.textSecondary} />
                  <Text style={[styles.missingBadgeText, { color: colors.textSecondary }]}>Not Uploaded</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {getDocStatus('INS') === 'Uploaded' ? (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              onPress={() => setViewerDocType('INS')}
              style={styles.viewVaultBtn}
            >
              <Eye size={16} color="#00f2ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeleteDoc('INS')}
              style={styles.deleteVaultBtn}
            >
              <Trash2 size={16} color="#ff4b4b" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onUploadDoc('INS', 'Vehicle Insurance')}
            style={styles.uploadVaultBtn}
          >
            <Plus size={16} color="#00f2ff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Full-Screen Document Image Viewer Modal */}
      <Modal
        visible={viewerDocType !== null}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setViewerDocType(null)}
      >
        <SafeAreaView style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.fullScreenHeader, { borderBottomColor: colors.borderGlass }]}>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>
              {viewerDocType ? getDoc(viewerDocType)?.name : 'Document'}
            </Text>
            <TouchableOpacity
              onPress={() => setViewerDocType(null)}
              style={[styles.fullScreenCloseBtn, { backgroundColor: colors.backgroundSelected }]}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Full Screen Image */}
          {viewerDocType && getDoc(viewerDocType) && (
            <View style={styles.fullScreenImageWrapper}>
              <Image
                source={{ uri: getDoc(viewerDocType)!.fileUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Verification Warning Footer */}
          <View style={[styles.fullScreenFooter, { borderTopColor: colors.borderGlass }]}>
            <Text style={styles.fullScreenFooterText}>
              ⚠️ Present this official document to verification authorities when requested.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#15161e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 20,
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  vaultRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vaultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 242, 255, 0.05)', // Cyber Cyan BG
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.15)', // Cyber Cyan Border
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vaultDetails: {
    flex: 1,
  },
  vaultName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vaultBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 204, 106, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 106, 0.15)',
  },
  uploadedBadgeText: {
    color: '#00cc6a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  missingBadgeText: {
    color: '#a0aab2',
    fontSize: 10,
    fontWeight: 'bold',
  },
  uploadVaultBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#00f2ff', // Cyber Cyan for upload button
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteVaultBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ff4b4b',
    backgroundColor: 'rgba(255, 75, 75, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  customDocName: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewVaultBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#00f2ff',
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullScreenCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageWrapper: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenFooter: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  fullScreenFooterText: {
    fontSize: 12,
    color: '#ffce00',
    textAlign: 'center',
    lineHeight: 18,
  },
});
