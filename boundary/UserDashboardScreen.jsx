import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Design Tokens
const C = {
  purple:      '#7C3AED',
  purpleLight: '#EDE9FE',
  dark:        '#111827',
  mid:         '#374151',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F3F4F6',
  successBg:   '#F0FDF4',
  successBorder:'#BBF7D0',
  successText: '#15803D',
};

// Success banner — shown on successful login
const Banner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={bn.wrap}>
      <Text style={bn.icon}>✅</Text>
      <Text style={bn.text}>{message}</Text>
    </View>
  );
};

const bn = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 16,
    paddingVertical:   12,
    backgroundColor:   C.successBg,
    borderBottomWidth: 1,
    borderBottomColor: C.successBorder,
  },
  icon: { fontSize: 16 },
  text: {
    flex:       1,
    fontSize:   14,
    fontWeight: '500',
    color:      C.successText,
  },
});


// MAIN SCREEN

const UserDashboardScreen = ({ navigation, route }) => {
  const user           = route?.params?.user           || null;
  const successMessage = route?.params?.successMessage || '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top bar */}
      <View style={styles.topBar}>
        {/* Brand */}
        <View style={styles.brand}>
          <Image source={require('../assets/BiteWiseLogo.png')} style={styles.brandLogo} />
          <Text style={styles.brandName}>BiteWise</Text>
        </View>

        {/* Profile button — navigates to AccountSettingsScreen (#12, #47) */}
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('AccountSettingsScreen', { user })}
          accessibilityRole="button"
          accessibilityLabel="Open account settings"
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {user?.username ? user.username[0].toUpperCase() : '?'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Login success banner */}
      <Banner message={successMessage} />

      {/* Dashboard placeholder — Sprint 2 content goes here */}
      <View style={styles.body}>
        <Text style={styles.greeting}>
          Welcome{user?.username ? `, ${user.username}` : ''}!
        </Text>
        <Text style={styles.subtext}>
          {user?.role === 'PREMIUM' ? 'Premium Member' : 'Free Member'}
        </Text>
        <Text style={styles.hint}>
          Tap your profile icon to manage your account.
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: C.bg,
  },
  topBar: {
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
  brandIcon: { fontSize: 20 },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
  },
  profileBtn: {
    padding: 4,
  },
  profileAvatar: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: C.purpleLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  profileInitial: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.purple,
  },
  body: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize:      24,
    fontWeight:    '800',
    color:         C.dark,
    marginBottom:  6,
    textAlign:     'center',
  },
  subtext: {
    fontSize:     14,
    color:        C.purple,
    fontWeight:   '600',
    marginBottom: 16,
  },
  hint: {
    fontSize:   14,
    color:      C.subtle,
    textAlign:  'center',
    lineHeight: 21,
  },
});

export default UserDashboardScreen;
