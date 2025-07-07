import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatData {
  title: string;
  value: string;
  note: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface StatCardProps {
  title: string;
  value: string;
  note: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface StatCardsContainerProps {
  style?: ViewStyle;
  data?: StatData[];
}

const StatCard: React.FC<StatCardProps> = ({ title, value, note, icon }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#9CA3AF" />
        </View>
      </View>
      <Text style={styles.cardValue}>{value}</Text>
      {note ? <Text style={styles.cardNote}>{note}</Text> : null}
    </View>
  );
};

const StatCardsContainer: React.FC<StatCardsContainerProps> = ({ style, data }) => {
  // Dummy data - you can replace this with props or API data later
  const defaultStats: StatData[] = [
    {
      title: "Trees Planted",
      value: "12.5k",
      note: "Last 30 days",
      icon: "leaf-outline"
    },
    {
      title: "Species Planted",
      value: "45",
      note: "Different varieties",
      icon: "flower-outline"
    },
    {
      title: "Area Covered",
      value: "2.8 ha",
      note: "Total area",
      icon: "map-outline"
    },
    {
      title: "Field Data Collectors",
      value: "23",
      note: "Active contributors",
      icon: "people-outline"
    },
    {
      title: "Projects Active",
      value: "8",
      note: "Ongoing projects",
      icon: "briefcase-outline"
    },
    {
      title: "Survival Rate",
      value: "94%",
      note: "This quarter",
      icon: "trending-up-outline"
    }
  ];

  const statsData = data || defaultStats;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {statsData.map((stat, index) => (
          <View key={index} style={styles.cardWrapper}>
            <StatCard
              title={stat.title}
              value={stat.value}
              note={stat.note}
              icon={stat.icon}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height:140,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 5,
  },
  cardWrapper: {
    marginRight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    paddingVertical:20,
    minWidth: 280,
    width: '60%',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default StatCardsContainer;