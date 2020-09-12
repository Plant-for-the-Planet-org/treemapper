import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Typography, Colors } from '_styles';

export default function index({progress}) {
  const [averageProgress, setAverageProgress] = useState(null);
  const average = () => {
    if (progress.length > 1) {
      const averageProgress = progress.reduce((a, b) => a + b) / progress.length;
      setAverageProgress(averageProgress);
    } else {
      setAverageProgress(progress);
    }
  };

  useEffect(() => {
    average();
  }, [progress]);

  return (
    <View>
      <View style={{flexDirection: 'row'}}>
        <Icon 
          size={25}
          name="md-sync"
          color={Colors.PRIMARY}
        />
        <Text style={styles.syncText}>Syncing</Text>
        <Text style={{paddingHorizontal: 2, color: Colors.TEXT_COLOR}}>-</Text>
        <Text style={styles.progressText}>{averageProgress}%</Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  syncText: {
    paddingLeft:10, 
    fontFamily: Typography.FONT_FAMILY_REGULAR, 
    fontSize: Typography.FONT_SIZE_14,
    color:Colors.TEXT_COLOR
  },
  progressText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR, 
  }
});
