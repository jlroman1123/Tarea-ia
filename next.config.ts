import type { NextConfig } from 'next';

const config: NextConfig = {
  // Permite el HMR desde la LAN local aunque cambie el último octeto de la IP.
  allowedDevOrigins: ['192.168.0.*'],
};

export default config;
