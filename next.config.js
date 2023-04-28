/**
 * @type {import('next').NextConfig}
 */


const nextConfig = {
  output: 'standalone',
  rewrites: async () => {
      return [
        {
            source: "/Json/",
            destination: "/Json/",
        }
     ]
  },
};

module.exports = nextConfig;
