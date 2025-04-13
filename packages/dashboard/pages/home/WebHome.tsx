import React from 'react';
import { YStack, H3 } from 'tamagui'; // Import XStack for row layout


export default function WebHomeScreen() {


    return (
        <YStack flex={1} backgroundColor="$background" paddingTop="$5" flexGrow={1}>
            <H3 fontSize={20} fontWeight={'600'}>TreeMapper Dashboard</H3>
        </YStack>
    );
}
 