import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View, StyleSheet} from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {colors, typography} from '../theme';

export type TabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false, // Özel label ve çizgi tasarımı için gizliyoruz
        tabBarIconStyle: {width: '100%', height: '100%'},
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({focused}) => {
          let label = '';
          switch (route.name) {
            case 'HomeTab':
              label = 'Ana Sayfa';
              break;
            case 'HistoryTab':
              label = 'Geçmiş';
              break;
            case 'ProfileTab':
              label = 'Profil';
              break;
          }

          return (
            <View style={styles.tabItem}>
              <Text
                style={[
                  styles.tabLabel,
                  focused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}>
                {label}
              </Text>
              {focused && <View style={styles.indicator} />}
            </View>
          );
        },
      })}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 64,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontFamily: typography.fontFamilyBold,
    color: colors.textPrimary,
  },
  tabLabelInactive: {
    fontFamily: typography.fontFamilyMedium,
    color: colors.textSecondary,
  },
  indicator: {
    width: 20,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 6,
  },
});
