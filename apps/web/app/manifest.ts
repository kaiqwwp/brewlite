import type { MetadataRoute } from 'next';

/** Web App Manifest: cho phép cài BrewLite lên màn hình chính điện thoại (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite – Đặt cà phê không tiền mặt',
    short_name: 'BrewLite',
    description: 'Đặt và thanh toán đồ uống chỉ trong vài chạm, nhận nhanh tại quầy.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f1ea',
    theme_color: '#573520',
    lang: 'vi',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
