import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import LogCard from './LogCard'
import { LogDetails } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'


const ErrorLogs = () => {
    const [logs, setLogs] = useState<LogDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0);
    const realm = useRealm()


    useEffect(() => {
        getAllLogs()
    }, [currentPage])


    const refreshHandler = () => {
        setLoading(true)
        setLogs([])
        setCurrentPage(0);
    }


    const getAllLogs = async () => {
        const start = currentPage * 20;
        const end = start + 20;
        const objects = realm
            .objects(RealmSchema.ActivityLogs)
            .filtered("logType == 'error'")
            .slice(start, end);
        console.log("JKH", objects)
        setLogs([...logs, ...JSON.parse(JSON.stringify(objects))])
        setLoading(false)
    }

    return (
        <View style={styles.container}>
            <FlatList data={[1, 2, 3, 4, 5]} renderItem={() => (<LogCard />)} refreshControl={
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
        marginTop: 10
    },

})