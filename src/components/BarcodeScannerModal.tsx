import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppColors, AppColors } from '../store/useThemeStore';
import { Typography, Spacing, BorderRadius } from '../theme';
import { fetchProductByBarcode, BarcodeProductInfo } from '../services/barcodeService';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onProductFound: (product: BarcodeProductInfo) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ visible, onClose, onProductFound }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.permissionBox}>
            <Text style={styles.permissionTitle}>Permissão de Câmera</Text>
            <Text style={styles.permissionText}>Precisamos acessar sua câmera para ler o código de barras do produto.</Text>
            <TouchableOpacity style={styles.requestBtn} onPress={requestPermission}>
              <Text style={styles.requestBtnText}>Conceder Permissão</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    setScanning(true);
    
    try {
      const product = await fetchProductByBarcode(data);
      if (product) {
        onProductFound(product);
      } else {
        Alert.alert('Não encontrado', 'Produto não encontrado no banco de dados OpenFoodFacts.');
      }
    } finally {
      setScanning(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBack}>
            <Text style={styles.headerBackText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ler Código de Barras</Text>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
          />
          {/* Mira central overlay */}
          <View style={styles.overlayBox}>
            <View style={styles.targetFrame} />
            <Text style={styles.instructionText}>Aponte para o código de barras</Text>
          </View>
          {scanning && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Buscando produto...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.xl },
  permissionBox: { backgroundColor: colors.surface, padding: Spacing.xl, borderRadius: BorderRadius.xl, alignItems: 'center' },
  permissionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: Spacing.sm },
  permissionText: { textAlign: 'center', color: colors.textSecondary, marginBottom: Spacing.lg },
  requestBtn: { backgroundColor: colors.primary, paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.md, width: '100%', alignItems: 'center' },
  requestBtnText: { color: colors.surface, fontWeight: Typography.bold },
  closeBtn: { marginTop: Spacing.md, paddingVertical: Spacing.sm },
  closeBtnText: { color: colors.textSecondary, fontWeight: Typography.bold },
  
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBack: { width: 40, height: 40, justifyContent: 'center' },
  headerBackText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  
  cameraContainer: { flex: 1, justifyContent: 'center' },
  camera: { ...StyleSheet.absoluteFill as any },
  overlayBox: { ...StyleSheet.absoluteFill as any, alignItems: 'center', justifyContent: 'center' },
  targetFrame: { width: 250, height: 150, borderWidth: 2, borderColor: 'white', borderRadius: 12, backgroundColor: 'transparent', marginBottom: 20 },
  instructionText: { color: 'white', fontSize: 16, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  
  loadingOverlay: { ...StyleSheet.absoluteFill as any, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  loadingText: { color: 'white', marginTop: 16, fontSize: 16, fontWeight: 'bold' },
});

export default BarcodeScannerModal;
