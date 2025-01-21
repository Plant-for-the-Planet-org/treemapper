import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import LogCard from './LogCard'
import { LogDetails } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { FONT_SIZE_18 } from 'src/utils/constants/typography'
import { Colors, Typography } from 'src/utils/constants'
import i18next from 'i18next'


const ErrorLogs = () => {
    const [errorLogs, setErrorLogs] = useState<LogDetails[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(0);
    const realm = useRealm()


    useEffect(() => {
        getAllErrorLogs()
    }, [currentPage])


    const refreshHandler = () => {
        setLoading(true)
        setErrorLogs([])
        setCurrentPage(0);
    }


    const getAllErrorLogs = async () => {
        try {
            setLoading(true);
            const start = currentPage * 20;
            const objects = realm
                .objects<LogDetails>(RealmSchema.ActivityLogs)
                .filtered("logLevel == 'error'")
                .sorted('timestamp', true)
                .slice(start, start + 20); // Inclusive range for 20 items
    
            setErrorLogs(currentPage ? [...errorLogs, ...objects] : [...objects]);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const emptyErrorComponent = () => {
        return <View style={styles.emptyContainer}>
            <Text style={styles.emptyLabel}>{i18next.t('label.no_logs')}</Text>
        </View>
    }

    return (
        <View style={styles.container}>
            <FlatList data={errorLogs} renderItem={({ item }) => (<LogCard data={item} />)}
                onEndReached={() => {
                    setCurrentPage(currentPage + 1);
                }}
                ListEmptyComponent={emptyErrorComponent()}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refreshHandler}
                    />} />
        </View>
    )
}

export default ErrorLogs

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        flex: 1
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: 'center',
    },
    emptyLabel: {
        width: '100%',
        fontSize: FONT_SIZE_18,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        textAlign: 'center',
        marginTop: 100
    }
})