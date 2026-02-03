import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default ({ mode }) => {
    // Load .env files based on the mode (e.g. development, production)
    const env = loadEnv(mode, process.cwd(), '');
    return defineConfig({
        plugins: [react()],
        server: {
            host: true,
            port: Number(env.VITE_PORT_CLIENT),
            proxy: {
                '/api': {
                    target: `${env.VITE_SERVER_URL}`,
                    changeOrigin: true,
                },
            },
            allowedHosts: [
                "endlesschess.live",
                "localhost",
            ]
        },
        resolve: {
            alias: {
                '@styles': '/src/styles',
                '@components': '/src/components',
                '@images': '/src/images',
                '@engine': '/src/engine',
            }
        }
    });
};
