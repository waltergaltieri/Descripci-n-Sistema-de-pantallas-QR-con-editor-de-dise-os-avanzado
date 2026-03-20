import {
  BookOpen,
  LayoutDashboard,
  Monitor,
  Package,
  Palette,
  QrCode,
  Store,
  Tag
} from 'lucide-react';

export const ADMIN_MODULES = {
  pantallas: {
    key: 'pantallas',
    label: 'Pantallas',
    appName: 'PantallasQR',
    brandIcon: Monitor,
    defaultRoute: '/dashboard',
    defaultTitle: 'Dashboard',
    searchPlaceholder: 'Buscar pantallas, diseños...',
    navigation: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard
      },
      {
        name: 'Pantallas',
        href: '/screens',
        icon: Monitor
      },
      {
        name: 'Diseños',
        href: '/designs',
        icon: Palette
      }
    ]
  },
  carteleria: {
    key: 'carteleria',
    label: 'Cartelería',
    appName: 'PantallasQR',
    brandIcon: Store,
    defaultRoute: '/carteleria/dashboard',
    defaultTitle: 'Dashboard',
    searchPlaceholder: 'Buscar productos, promociones, menús o QR...',
    navigation: [
      {
        name: 'Dashboard',
        href: '/carteleria/dashboard',
        icon: LayoutDashboard
      },
      {
        name: 'Productos',
        href: '/carteleria/products',
        icon: Package
      },
      {
        name: 'Promociones',
        href: '/carteleria/promotions',
        icon: Tag
      },
      {
        name: 'Menús',
        href: '/carteleria/menus',
        icon: BookOpen
      },
      {
        name: 'Links y QR',
        href: '/carteleria/links',
        icon: QrCode
      }
    ]
  }
};

const PAGE_METADATA = [
  {
    title: 'Dashboard',
    matches: (pathname) => pathname === '/dashboard'
  },
  {
    title: 'Gestión de Pantallas',
    matches: (pathname) => pathname === '/screens'
  },
  {
    title: 'Gestión de Diseños',
    matches: (pathname) => pathname === '/designs'
  },
  {
    title: 'Dashboard',
    matches: (pathname) => pathname === '/carteleria/dashboard'
  },
  {
    title: 'Productos',
    matches: (pathname) => pathname === '/carteleria/products'
  },
  {
    title: 'Promociones',
    matches: (pathname) => pathname === '/carteleria/promotions'
  },
  {
    title: 'Menús',
    matches: (pathname) => pathname === '/carteleria/menus'
  },
  {
    title: 'Links y QR',
    matches: (pathname) => pathname === '/carteleria/links'
  }
];

export const getAdminModuleKey = (pathname = '') =>
  pathname.startsWith('/carteleria') ? 'carteleria' : 'pantallas';

export const getCurrentAdminModule = (pathname = '') =>
  ADMIN_MODULES[getAdminModuleKey(pathname)];

export const getPageMetadata = (pathname = '') => {
  const module = getCurrentAdminModule(pathname);
  const page = PAGE_METADATA.find((item) => item.matches(pathname));

  return {
    module,
    moduleKey: module.key,
    title: page?.title || module.defaultTitle
  };
};

export const getModeSwitchOptions = (pathname = '') => {
  const activeModuleKey = getAdminModuleKey(pathname);

  return Object.values(ADMIN_MODULES).map((module) => ({
    key: module.key,
    label: module.label,
    href: module.defaultRoute,
    active: module.key === activeModuleKey
  }));
};
