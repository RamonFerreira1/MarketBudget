import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { register } from '../services/authService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppColors, AppColors } from '../store/useThemeStore';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui uma conta. Tente fazer login.';
    case 'auth/invalid-email':
      return 'E-mail inválido. Verifique o formato (ex: nome@email.com).';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Verifique sua rede.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    default:
      return 'Algo deu errado ao criar sua conta. Tente novamente.';
  }
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const clearError = () => setErrorMsg('');

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password || !confirmPassword) {
      setErrorMsg('Preencha todos os campos para criar sua conta.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password);
      setSuccessMsg('Conta criada com sucesso! Entrando...');
      // Navigation to Home will happen automatically via auth state listener
    } catch (error: any) {
      const code = error?.code ?? '';
      setErrorMsg(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.logoIcon}>🛒</Text>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Rápido e gratuito — sincronize em qualquer dispositivo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, errorMsg ? styles.inputError : null]}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(t) => { setEmail(t); clearError(); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={[styles.input, errorMsg ? styles.inputError : null]}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={(t) => { setPassword(t); clearError(); }}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputLast,
              errorMsg ? styles.inputError : null,
            ]}
            placeholder="Repita a senha"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
            secureTextEntry
          />

          {/* Error message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Success message */}
          {successMsg ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Criar minha conta</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>
                  Já tem uma conta?{' '}
                  <Text style={styles.linkTextBold}>Entrar</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backBtnText: {
    color: colors.surface,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  logoIcon: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: colors.surface,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.75)',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadow.lg,
  },
  label: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.md,
    color: colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputLast: {
    marginBottom: Spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  errorIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sm,
    color: '#B91C1C',
    fontWeight: Typography.medium,
    lineHeight: 20,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  successIcon: {
    fontSize: 15,
  },
  successText: {
    flex: 1,
    fontSize: Typography.sm,
    color: '#065F46',
    fontWeight: Typography.medium,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkText: {
    fontSize: Typography.base,
    color: colors.textSecondary,
  },
  linkTextBold: {
    color: colors.primaryDark,
    fontWeight: Typography.bold,
  },
});

export default RegisterScreen;
