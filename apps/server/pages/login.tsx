import { useState, useEffect } from 'react';
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
  Separator,
  getTokens,
  createMedia
} from 'tamagui';
import ImageNext from 'next/image';

// Create custom media query breakpoints
const media = createMedia({
  xs: { maxWidth: 660 },
  sm: { maxWidth: 800 },
  md: { maxWidth: 1020 },
  lg: { maxWidth: 1280 },
  xl: { minWidth: 1281 },
});

const { useMedia } = media;

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const GoogleImage = require('../public/googleplay.png');
  const Apple = require('../public/apple.png');

  // Set up window resize listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);

      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Determine screen size
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

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
        email: 'user@example.com',
        password: 'password'
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

  // Mobile layout
  if (isMobile) {
    return (
      <YStack width="100%" minHeight="100vh" backgroundColor="$background">
        {/* Header / Login Section */}
        <YStack padding="$4" space="$4" flex={1} justifyContent="center">
          <YStack alignItems="center" space="$4" marginBottom="$4">
            <H1 fontWeight="bold" textAlign="center">TreeMapper</H1>
            <Text fontSize="$4" textAlign="center" fontWeight="500">
              The free monitoring tool for forest restoration programs
            </Text>
          </YStack>

          <YStack space="$2" marginBottom="$2" alignItems="center">
            <H3 color="$gray10" textAlign="center">Sign in to continue</H3>
          </YStack>

          <Card padding="$4" bordered marginBottom="$4">
            <Paragraph color="$gray10" textAlign="center">
              The TreeMapper Admin Dashboard gives you full access to monitor, manage, and verify restoration data collected from the field — enabling transparency, accountability, and smarter reforestation, all in one place.
            </Paragraph>
          </Card>

          {error && (
            <Text color="$red10" marginVertical="$2" textAlign="center">
              {error}
            </Text>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <YStack space="$4" width="100%">
              <Button
                backgroundColor="$blue10"
                color="white"
                onPress={() => { }}
                disabled={isLoading}
                width="100%"
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

        {/* Footer / App Download Section */}
        <YStack padding="$4" backgroundColor="$backgroundStrong" alignItems="center" space="$4">
          <Text fontWeight="500" textAlign="center">
            Download our mobile app
          </Text>

          <XStack space="$4" justifyContent="center" flexWrap="wrap">
            <Button
              width="auto"
              borderRadius="$4"
              borderWidth={1}
              pressStyle={{ opacity: 0.8 }}
              marginBottom="$2"
              backgroundColor={'white'}
            >
              <XStack space="$2" alignItems="center">
                <ImageNext src={GoogleImage} width={24} height={24} alt="Google Play" />
                <Text fontWeight="bold">Google Play</Text>
              </XStack>
            </Button>

            <Button
              width="auto"
              borderRadius="$4"
              borderWidth={1}
              pressStyle={{ opacity: 0.8 }}
              backgroundColor={'white'}
            >
              <XStack space="$2" alignItems="center">
                <ImageNext src={Apple} width={24} height={24} alt="App Store" />
                <Text fontWeight="bold">App Store</Text>
              </XStack>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    );
  }

  // Tablet layout
  if (isTablet) {
    return (
      <YStack width="100%" height="100vh" backgroundColor="$background">
        <XStack flex={1} overflow="hidden">
          {/* Left side - branding section */}
          <YStack width="50%" padding="$5" space="$4" justifyContent="center">
            <YStack>
              <H1 fontWeight="bold">TreeMapper</H1>
              <Text fontSize="$5" fontWeight="500" marginTop="$2">
                The free monitoring tool for forest restoration programs
              </Text>
              <XStack space="$4" marginTop="$5" flexWrap="wrap">
                <Button
                  width="auto"
                  borderRadius="$4"
                  borderWidth={1}
                  pressStyle={{ opacity: 0.8 }}
                  marginBottom="$2"
                  backgroundColor={"white"}
                >
                  <XStack space="$2" alignItems="center">
                    <ImageNext src={GoogleImage} width={24} height={24} alt="Google Play" />
                    <Text fontWeight="bold">Google Play</Text>
                  </XStack>
                </Button>

                <Button
                  width="auto"
                  borderRadius="$4"
                  borderWidth={1}
                  backgroundColor={'white'}
                  pressStyle={{ opacity: 0.8 }}
                >
                  <XStack space="$2" alignItems="center">
                    <ImageNext src={Apple} width={24} height={24} alt="App Store" />
                    <Text fontWeight="bold">App Store</Text>
                  </XStack>
                </Button>
              </XStack>
            </YStack>
          </YStack>

          {/* Right side - login section */}
          <YStack
            width="50%"
            padding="$5"
            space="$4"
            justifyContent="center"
            backgroundColor="$backgroundStrong"
          >
            <YStack space="$2" marginBottom="$2">
              <H1 fontWeight="bold">Welcome Back</H1>
              <H3 color="$gray10">Sign in to continue</H3>
            </YStack>

            <Card padding="$4" bordered marginBottom="$4">
              <Paragraph color="$gray10">
              The TreeMapper Admin Dashboard gives you full access to monitor, manage, and verify restoration data collected from the field — enabling transparency, accountability, and smarter reforestation, all in one place.
              </Paragraph>
            </Card>

            {error && (
              <Text color="$red10" marginVertical="$2">
                {error}
              </Text>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <YStack space="$4" width="100%">
                <Button
                  backgroundColor="$blue10"
                  color="white"
                  onPress={() => { }}
                  disabled={isLoading}
                  width="100%"
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
      </YStack>
    );
  }

  // Desktop layout
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
              <Button width="auto" borderRadius="$4" borderWidth={1} pressStyle={{ opacity: 0.8 }} backgroundColor={'white'}>
                <XStack space="$2" alignItems="center" >
                  <ImageNext src={GoogleImage} width={24} height={24} alt="Google Play" />
                  <Text fontWeight="bold">Google Play</Text>
                </XStack>
              </Button>

              <Button width="auto" borderRadius="$4" borderWidth={1} pressStyle={{ opacity: 0.8 }} backgroundColor={'white'}>
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
        width="40%"
        height="100%"
        padding="$6"
        space="$4"
        justifyContent="center"
        backgroundColor="$backgroundStrong"
      >
        <YStack space="$2" marginBottom="$2">
          <H1 fontWeight="bold">Welcome Back</H1>
          <H3 color="$gray10">Sign in to continue</H3>
        </YStack>

        <Card padding="$4" bordered marginBottom="$4">
          <Paragraph color="$gray10">
          The TreeMapper Admin Dashboard gives you full access to monitor, manage, and verify restoration data collected from the field — enabling transparency, accountability, and smarter reforestation, all in one place.
          </Paragraph>
        </Card>

        {error && (
          <Text color="$red10" marginVertical="$2">
            {error}
          </Text>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <YStack space="$4" width="100%">
            <Separator marginVertical="$2" />

            <Button
              backgroundColor="$blue10"
              color="white"
              onPress={() => { }}
              disabled={isLoading}
              width="100%"
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