import type { AppProps } from 'next/app'
import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
            </Head>
            <Component {...pageProps} />
        </>
    )
}
