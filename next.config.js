/** @type {import("next").NextConfig} */
const nextConfig = {
  // SWC設定（Next.js 15ではデフォルトで有効）
  compiler: {
    // SWCコンパイラーオプション
    removeConsole: process.env.NODE_ENV === 'production', // 本番環境でconsole.log削除
    styledComponents: true, // styled-components サポート（使用している場合）
    emotion: false, // Emotion サポート（デフォルト無効）
    reactRemoveProperties: process.env.NODE_ENV === 'production', // 本番環境でReactプロパティ削除
  },
  // 実験的機能でSWCの最適化を有効化
  experimental: {
    swcTraceProfiling: false, // SWCトレース（デバッグ用）
    swcPlugins: [], // SWCプラグイン（必要に応じて追加）
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
    }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
