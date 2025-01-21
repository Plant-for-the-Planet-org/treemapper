import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import LogCard from './LogCard'
import { LogDetails } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'


const AllLogs = () => {
    const [logs, setLogs] = useState<LogDetails[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(0);
    const realm = useRealm()


    useEffect(() => {
        getAllLogs()
    }, [currentPage])


    const refreshHandler = () => {
        setCurrentPage(0);
    }


    const getAllLogs = async () => {
        try {
            setLoading(true);
            const start = currentPage * 20;
            const objects = realm
                .objects<LogDetails>(RealmSchema.ActivityLogs)
                .filtered("logLevel != 'error'")
                .sorted('timestamp', true)
                .slice(start, start + 20); // Inclusive range for 20 items
    
            setLogs(currentPage ? [...logs, ...objects] : [...objects]);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList data={logs} renderItem={({ item }) => (<LogCard data={item} />)}
                onEndReached={() => {
                    setCurrentPage(currentPage + 1);
                }}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refreshHandler}
                    />} />
        </View>
    )
}

export default AllLogs

const styles = StyleSheet.create({
    container: {
        marginTop: 10
    },

})