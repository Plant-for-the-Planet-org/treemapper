import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@realm/react'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IAdditionalDetailsForm } from 'src/types/interface/app.interface'
import { convertLegacyForm } from 'src/utils/helpers/formHelper/legacyFormConverter'

// Lists the forms this device still holds from the retired Additional Data
// builder. They were only ever stored in Realm, so this screen is the one place
// they can still be seen, and the only route for getting them onto the
// dashboard where Forms now live.
const LegacyFormsView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const forms = useQuery<IAdditionalDetailsForm>(RealmSchema.AdditionalDetailsForm)

  const openForm = (form: IAdditionalDetailsForm) => {
    if (form.migrated_at) return
    navigation.navigate('LegacyFormSync', { formId: form.form_id })
  }

  const renderItem = ({ item }: { item: IAdditionalDetailsForm }) => {
    const converted = convertLegacyForm(item)
    const synced = !!item.migrated_at
    const empty = converted.fieldCount === 0

    return (
      <TouchableOpacity
        style={styles.card}
        disabled={synced || empty}
        onPress={() => openForm(item)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{item.title || 'Untitled form'}</Text>
          <View style={[styles.chip, synced && styles.chipDone]}>
            <Text style={[styles.chipText, synced && styles.chipTextDone]}>
              {synced ? 'Synced' : 'Not synced'}
            </Text>
          </View>
        </View>
        {!!item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.cardMeta}>
          {empty
            ? 'No fields that can be moved'
            : `${converted.fieldCount} field${converted.fieldCount === 1 ? '' : 's'}`}
          {converted.dropped.length > 0 && !empty
            ? ` · ${converted.dropped.length} will be left out`
            : ''}
        </Text>
        {synced && (
          <Text style={styles.cardSynced}>
            Now a form in {item.migrated_project_name || 'your project'}
          </Text>
        )}
      </TouchableOpacity>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>
        This device has no forms from the old Additional Data builder.
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label="Offline forms" note="From Additional Data" />
      <FlatList
        data={[...forms]}
        keyExtractor={(item) => item.form_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          forms.length > 0 ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                Forms are now built on the web dashboard and sent to every
                device on the project. Sync a form here to keep using it.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

export default LegacyFormsView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  note: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.BACKDROP_COLOR,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  noteText: {
    fontSize: Typography.FONT_SIZE_13,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    lineHeight: Typography.LINE_HEIGHT_19,
  },
  card: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.GRAY_LIGHT,
    marginLeft: 10,
  },
  chipDone: {
    backgroundColor: Colors.NEW_PRIMARY,
  },
  chipText: {
    fontSize: Typography.FONT_SIZE_11,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  chipTextDone: {
    color: Colors.WHITE,
  },
  cardDesc: {
    fontSize: Typography.FONT_SIZE_13,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginTop: 6,
  },
  cardMeta: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginTop: 8,
  },
  cardSynced: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
    marginTop: 6,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 60,
  },
  emptyText: {
    fontSize: Typography.FONT_SIZE_15,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    textAlign: 'center',
  },
})
