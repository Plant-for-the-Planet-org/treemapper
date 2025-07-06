import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { Typography, Colors } from 'src/utils/constants'
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import RotatingView from './RotatingView';
import { useRealm } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { Inventory } from 'src/types/interface/slice.interface';
import { migrateInventoryToIntervention } from 'src/utils/helpers/interventionHelper/migrateInventoryHelper';
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement';
import { useDispatch } from 'react-redux';
import { updateDataMigrated } from 'src/store/slice/appStateSlice';

const InventoryMigration = () => {

    const dispatch = useDispatch()
    const realm = useRealm()
    const { addMigrationInventory } = useInterventionManagement()

    useEffect(() => {
        getMigrationData()

    }, [])

    const getMigrationData = async () => {
        const allInventory = realm
            .objects<Inventory[]>(RealmSchema.Inventory)
            .filtered('status=="PENDING_DATA_UPLOAD"')
        for (const item of allInventory) {
            if (item.inventory_id === null || !item.inventory_id || item.inventory_id == 'null') {
                continue;
            }
            const element = await migrateInventoryToIntervention(item);
            await addMigrationInventory(element, item.inventory_id);
        }
        dispatch(updateDataMigrated(true))
    }


    return (
        <View style={styles.blockContainer}>
            <RotatingView isClockwise={true}>
                <RefreshIcon />
            </RotatingView>
            <Text style={styles.label}>Migrating</Text>
        </View>
    )
}

export default InventoryMigration

const styles = StyleSheet.create({
    blockContainer: {
        paddingHorizontal: 10,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        borderRadius: 10,
        marginRight: 10
    },
    label: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 8
    },
    infoIconWrapper: {
        marginRight: 5,
        marginLeft: 10
    },
})