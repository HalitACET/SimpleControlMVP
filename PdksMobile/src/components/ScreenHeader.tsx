import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '../theme';

import {useSession} from '../store/session';

interface ScreenHeaderProps {
  title: string;
  companyName?: string;
  fullName?: string;
}

export default function ScreenHeader({
  title,
  companyName,
  fullName,
}: ScreenHeaderProps) {
  const session = useSession();
  const displayCompany = companyName || session.firmId || 'PDKS';

  // Baş harfleri al
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fullName);

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <Text style={styles.companyText}>{displayCompany.toUpperCase()}</Text>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 10, // StatusBar için ekstra alan
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.darkElevated,
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  companyText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 11,
    color: colors.textOnDarkMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  titleText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    color: colors.textOnDark,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  avatarText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});
