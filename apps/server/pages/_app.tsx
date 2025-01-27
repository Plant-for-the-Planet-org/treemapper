import type { AppProps } from 'next/app'
import {Wrapper} from 'dashboard/provider/index'
import Head from 'next/head'
import 'raf/polyfill'

export default function App({ Component, pageProps }: AppProps) {

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Wrapper>
        <Component {...pageProps} />
      </Wrapper>
    </>
  )
}