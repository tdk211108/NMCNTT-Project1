export const WIDE_CONTAINER_CLASS = 'mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10';
export const CATALOG_CONTAINER_CLASS = 'mx-auto w-full max-w-[1760px] px-4 sm:px-6 lg:px-8';
export const CENTERED_CONTAINER_CLASS = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

export function isCatalogContainerRoute(pathname: string | null | undefined): boolean {
  return (
    pathname === '/cpu' ||
    pathname === '/gpu' ||
    pathname === '/tools/perf-per-price'
  );
}

export function isWideContainerRoute(pathname: string | null | undefined): boolean {
  return pathname === '/' || isCatalogContainerRoute(pathname);
}

export function getChromeContainerClass(): string {
  return WIDE_CONTAINER_CLASS;
}

export function getMainContainerClass(pathname: string | null | undefined): string {
  if (pathname === '/') {
    return 'w-full flex-1 pb-6';
  }
  if (isCatalogContainerRoute(pathname)) {
    return `${CATALOG_CONTAINER_CLASS} flex-1 py-6`;
  }
  return `${CENTERED_CONTAINER_CLASS} flex-1 py-6`;
}
