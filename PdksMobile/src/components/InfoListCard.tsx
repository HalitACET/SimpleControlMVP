import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Card from './Card';
import {colors, spacing, typography, radius} from '../theme';

interface InfoListCardProps {
  title: string;
  items: string[];
}

export default function InfoListCard({title, items}: InfoListCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      <View style={styles.listContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    width: '100%',
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  listContainer: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2, // Metinle hizalama için hafif aşağı çekme
  },
  numberText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemText: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
