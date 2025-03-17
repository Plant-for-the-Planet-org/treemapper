// pages/dashboard/index.tsx
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { YStack, XStack, Button, Text, H1 } from 'tamagui';
import { requireAuth } from '../../util/auth';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <YStack space="$4" padding="$6">
      <XStack justify="space-between" alignItems="center">
        <H1>Dashboard</H1>
        <Button onPress={handleSignOut}>Sign Out</Button>
      </XStack>
      
      <YStack marginTop="$6">
        <Text>Welcome, {session?.user?.name || 'User'}!</Text>
        <Text>Email: {session?.user?.email}</Text>
        
        {/* Your dashboard content here */}
        <YStack marginTop="$6">
          <Text>Your dashboard content goes here</Text>
        </YStack>
      </YStack>
    </YStack>
  );
}

// Server-side protection
export async function getServerSideProps(context) {
  return requireAuth(context);
}