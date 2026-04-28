import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreateAccountController  from '../controller/CreateAccountController';
import ViewPricingPlansController from '../controller/ViewPricingPlansController';

const controller        = new CreateAccountController();
const plansController   = new ViewPricingPlansController();

// Design Tokens
const C = {
  purple:      '#7C3AED',
  purpleLight: '#EDE9FE',
  purplePale:  '#FAF5FF',
  dark:        '#111827',
  mid:         '#374151',
  body:        '#4B5563',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F3F4F6',
  errorBg:     '#FEF2F2',
  errorBorder: '#FECACA',
  errorText:   '#DC2626',
  green:       '#059669',
  greenPale:   '#ECFDF5',
};


// SUB-COMPONENTS

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={nav.backBtn}>
      <Text style={nav.backText}>← Back</Text>
    </TouchableOpacity>
  </View>
);

const nav = StyleSheet.create({
  bar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
    backgroundColor:   C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  icon:      { fontSize: 20 },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
  },
  menuBtn: {
    padding:    6,
    gap:        4,
    alignItems: 'flex-end',
  },
  menuLine: {
    width:           22,
    height:          2.5,
    backgroundColor: C.dark,
    borderRadius:    2,
  },
  backBtn:  { padding: 6 },
  backText: { fontSize: 14, fontWeight: '500', color: '#374151' },
});

// Labelled input with optional error box
const InputField = ({ label, value, onChangeText, placeholder, secureTextEntry, error, keyboardType }) => (
  <View style={inf.wrap}>
    <Text style={inf.label}>{label}</Text>
    {error ? (
      <View style={inf.errorBox}>
        <Text style={inf.errorText}>{error}</Text>
      </View>
    ) : null}
    <TextInput
      style={[inf.input, error && inf.inputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.subtle}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType || 'default'}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
);

const inf = StyleSheet.create({
  wrap:       { marginBottom: 16 },
  label: {
    fontSize:     14,
    fontWeight:   '600',
    color:        C.dark,
    marginBottom: 6,
  },
  errorBox: {
    backgroundColor:   C.errorBg,
    borderWidth:       1,
    borderColor:       C.errorBorder,
    borderRadius:      8,
    paddingVertical:   8,
    paddingHorizontal: 12,
    marginBottom:      8,
  },
  errorText: {
    fontSize: 13,
    color:    C.errorText,
  },
  input: {
    backgroundColor:   C.bg,
    borderRadius:      8,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontSize:          15,
    color:             C.dark,
    borderWidth:       1,
    borderColor:       C.border,
  },
  inputError: {
    borderColor: C.errorBorder,
  },
});

// Feature tick row — used inside plan cards
const FeatureRow = ({ text }) => (
  <View style={fr.row}>
    <Text style={fr.tick}>✓</Text>
    <Text style={fr.text}>{text}</Text>
  </View>
);

const fr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
    marginBottom:  6,
  },
  tick: {
    fontSize:   13,
    fontWeight: '700',
    color:      C.green,
    width:      14,
    marginTop:  1,
  },
  text: {
    flex:       1,
    fontSize:   13,
    color:      C.body,
    lineHeight: 19,
  },
});

// UC #09 — Plan selection card
const PlanCard = ({ plan, isSelected, onSelect }) => {
  const popular = plan.isMostPopular();
  return (
    <TouchableOpacity
      style={[pc.card, popular && pc.cardPopular, isSelected && pc.cardSelected]}
      onPress={() => onSelect(plan.planId)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Select ${plan.name} plan`}
    >
      {popular && (
        <View style={pc.badge}>
          <Text style={pc.badgeText}>Most Popular</Text>
        </View>
      )}
      <Text style={pc.name}>{plan.name}</Text>
      <Text style={pc.price}>{plan.getFormattedPrice()}</Text>
      <Text style={pc.description}>{plan.description}</Text>
      <View style={pc.divider} />
      {plan.getFeatureList().map((feat, i) => (
        <FeatureRow key={i} text={feat} />
      ))}
      {/* Selected indicator */}
      {isSelected && (
        <View style={pc.selectedBadge}>
          <Text style={pc.selectedBadgeText}>✓ Selected</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const pc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         18,
    marginBottom:    12,
    borderWidth:     1.5,
    borderColor:     C.border,
  },
  cardPopular: {
    backgroundColor: C.purplePale,
    borderColor:     C.purple,
  },
  cardSelected: {
    borderColor: C.purple,
    borderWidth: 2.5,
  },
  badge: {
    alignSelf:         'flex-start',
    backgroundColor:   C.purple,
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   3,
    marginBottom:      10,
  },
  badgeText: {
    fontSize:   11,
    fontWeight: '700',
    color:      C.white,
  },
  name: {
    fontSize:     18,
    fontWeight:   '800',
    color:        C.dark,
    marginBottom: 2,
  },
  price: {
    fontSize:     24,
    fontWeight:   '800',
    color:        C.purple,
    marginBottom: 4,
  },
  description: {
    fontSize:     13,
    color:        C.subtle,
    marginBottom: 12,
  },
  divider: {
    height:          1,
    backgroundColor: C.border,
    marginBottom:    12,
  },
  selectedBadge: {
    marginTop:         10,
    backgroundColor:   C.greenPale,
    borderRadius:      8,
    paddingVertical:   6,
    alignItems:        'center',
  },
  selectedBadgeText: {
    fontSize:   13,
    fontWeight: '700',
    color:      C.green,
  },
});


// MAIN SCREEN

const CreateAccountScreen = ({ navigation, route }) => {
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(route?.params?.selectedPlanId || 1);
  const [fieldErrors,     setFieldErrors]     = useState({});
  const [isLoading,       setIsLoading]       = useState(false);
  const [plans,           setPlans]           = useState([]);
  const [plansLoading,    setPlansLoading]    = useState(true);

  // UC #09: load plans on mount
  useEffect(() => {
    plansController.fetchAllPlans().then((result) => {
      if (result.success) setPlans(result.data);
      setPlansLoading(false);
    });
  }, []);

  useEffect(() => {
    if (route?.params?.selectedPlanId) {
      setSelectedPlanId(route.params.selectedPlanId);
    }
  }, [route?.params?.selectedPlanId]);

  // UC #08 / #09 Step 2: user taps Create Account
  const handleCreateAccount = useCallback(async () => {
    setFieldErrors({});
    setIsLoading(true);

    const result = await controller.createAccount({
      username,
      email,
      password,
      confirmPassword,
      selectedPlanId,
    });

    setIsLoading(false);

    if (result.success) {
      navigation.navigate('OnboardingScreen', { user: result.user });
    } else {
      if (result.field) {
        setFieldErrors({ [result.field]: result.message });
      }
    }
  }, [username, email, password, confirmPassword, selectedPlanId, navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Account details card */}
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join BiteWise and start your health journey</Text>

            <InputField
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              error={fieldErrors.username}
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              error={fieldErrors.email}
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={fieldErrors.password}
            />
            <InputField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              error={fieldErrors.confirm}
            />
          </View>

          {/* UC #09 — Plan selection */}
          <View style={styles.planSection}>
            <Text style={styles.planTitle}>Choose Your Plan</Text>
            <Text style={styles.planSubtitle}>Select the plan that fits your needs</Text>

            {plansLoading ? (
              <ActivityIndicator size="small" color={C.purple} style={{ marginTop: 16 }} />
            ) : (
              plans.map((plan) => (
                <PlanCard
                  key={plan.planId}
                  plan={plan}
                  isSelected={selectedPlanId === plan.planId}
                  onSelect={setSelectedPlanId}
                />
              ))
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleCreateAccount}
            activeOpacity={0.85}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
          >
            <Text style={styles.btnText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow:          1,
    paddingHorizontal: 16,
    paddingVertical:   24,
  },
  card: {
    backgroundColor: C.white,
    borderRadius:    16,
    padding:         24,
    borderWidth:     1,
    borderColor:     C.border,
    marginBottom:    20,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  title: {
    fontSize:      24,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
    marginBottom:  4,
  },
  subtitle: {
    fontSize:     14,
    color:        C.subtle,
    marginBottom: 24,
  },
  planSection: {
    marginBottom: 20,
  },
  planTitle: {
    fontSize:      20,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
    marginBottom:  4,
  },
  planSubtitle: {
    fontSize:     14,
    color:        C.subtle,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: C.purple,
    borderRadius:    12,
    paddingVertical: 16,
    alignItems:      'center',
    marginBottom:    16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.white,
  },
  loginRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   8,
  },
  loginPrompt: {
    fontSize: 14,
    color:    C.subtle,
  },
  loginLink: {
    fontSize:   14,
    fontWeight: '600',
    color:      C.purple,
  },
});

export default CreateAccountScreen;
