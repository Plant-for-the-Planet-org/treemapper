import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  YStack,
  XStack,
  Button,
  Input,
  Text,
  H1,
  H3,
  Image,
  Card,
  Paragraph,
  Separator
} from 'tamagui';
import ImageNext from 'next/image';

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const GoogleImage= require('../public/googleplay.png')
const Apple= require('../public/apple.png')


  if (status === 'authenticated') {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email:'user@example.com',
        password:'password'
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push((router.query?.callbackUrl as string) || '/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <XStack width="100%" height="100vh" overflow="hidden">
      {/* Left Side - Improved UI */}
      <YStack width="60%" height="100%" padding="$6" justifyContent="center"
        backgroundColor="$background">
        <XStack alignItems="center" space="$6" justifyContent='center'>
          {/* TreeMapper Logo & Text */}
          <YStack marginRight="$15">
            <XStack alignItems="center" space="$2">
              <H1 fontWeight="bold">TreeMapper</H1>
            </XStack>
            <Text fontSize="$6" fontWeight="500" marginTop="$2">
              The free monitoring tool for forest restoration programs
            </Text>
            <XStack space="$4" marginTop="$5">
              <Button width="auto" borderRadius="$4" borderWidth={1} pressStyle={{ opacity: 0.8 }}>
                <XStack space="$2" alignItems="center">
                  <ImageNext src={GoogleImage} width={24} height={24} alt="Google Play" />
                  <Text fontWeight="bold">Google Play</Text>
                </XStack>
              </Button>

              <Button width="auto" borderRadius="$4" borderWidth={1} pressStyle={{ opacity: 0.8 }}>
                <XStack space="$2" alignItems="center">
                  <ImageNext src={Apple} width={24} height={24} alt="App Store" />
                  <Text fontWeight="bold">App Store</Text>
                </XStack>
              </Button>
            </XStack>
          </YStack>
          <Image
            source={{ uri: 'https://www.plant-for-the-planet.org/wp-content/uploads/2024/05/TreeMapper-intro.png?x95944' }}
            resizeMode="contain"
            alt="TreeMapper App Preview"
            style={{ width: '25%', height: '70vh', position: 'absolute', right: '15%' }}
          />
        </XStack>
      </YStack>

      {/* Right Side - Login Form */}
      <YStack
        width="30%"
        height="100%"
        padding="$6"

        space="$4"
        justifyContent="center"
        backgroundColor="$background"
      >
        <YStack space="$2" marginBottom="$2">
          <H1 fontWeight="bold">Welcome Back</H1>
          <H3 color="$gray10">Sign in to continue</H3>
        </YStack>

        <Card padding="$4" bordered marginBottom="$4">
          <Paragraph color="$gray10">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam scelerisque est vel
            feugiat eleifend. Nulla facilisi. Sed in libero vel ex faucibus cursus.
          </Paragraph>

          <Separator marginVertical="$2" />

          <Paragraph size="$2" color="$gray9">
            Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;
            Integer id efficitur eros.
          </Paragraph>
        </Card>

        {error && (
          <Text color="$red10" marginVertical="$2">
            {error}
          </Text>
        )}

        <form onSubmit={handleSubmit}>
          <YStack space="$4">

            <Separator marginVertical="$2" />

            <Button
              backgroundColor="$blue10"
              color="white"
              onPress={() => { }}
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Login / Signup'}
            </Button>

            <XStack justifyContent="center" marginTop="$2">
              <Text color="$gray10">Having Trouble? </Text>
              <Text color="$blue10" fontWeight="bold" onPress={() => { }}>
                &nbsp;Contact Us
              </Text>
            </XStack>
          </YStack>
        </form>
      </YStack>
    </XStack>
  );
}
