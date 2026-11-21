export const STORE_DISPLAY_NAME = 'CoreRaster';

export const CART_STORAGE_KEY = 'pcstore.cart.v1';
export const COMPARE_STORAGE_KEY = 'pcstore.compare.v1';
export const CHECKOUT_ATTEMPT_KEY = 'pcstore.checkout.attempt';
export const ORDER_TOKEN_KEY_PREFIX = 'pcstore.order.';
export const ORDER_TOKEN_KEY_SUFFIX = '.token';

export const CART_MAX_ITEMS = 20;
export const CART_MIN_QTY = 1;
export const CART_MAX_QTY = 100;
export const FREE_SHIPPING_MIN_QTY = 2;
export const STANDARD_SHIPPING_FEE_VND = 50_000;

export const COMPARE_MIN_ITEMS = 2;
export const COMPARE_MAX_ITEMS = 3;

export const CATALOG_MAX_RESULTS = 200;
export const FEATURED_PER_CATEGORY = 8;
export const LANDING_FEATURED_CPU_IDS = [
  'cpu-intel-core-i5-14600k',
  'cpu-amd-ryzen-7-9800x3d',
  'cpu-intel-core-ultra-7-270k-plus',
  'cpu-amd-ryzen-5-7500f',
  'cpu-intel-core-ultra-9-285k',
] as const;
export const LANDING_FEATURED_GPU_IDS = [
  'gpu-asus-t1-rtx-5060-ti-8gb-oc',
  'gpu-asus-rog-astral-rtx-5090-dhahab-oc',
  'gpu-asus-rog-matrix-30th-rtx-5090-32gb',
  'gpu-asus-rog-astral-rtx-5080-16gb-hatsune-miku-oc',
  'gpu-msi-rtx-5090-32gb-lightning-z',
] as const;
export const CPU_PER_BRAND_PAGE_SIZE = 16;
export const GPU_PAGE_SIZE = 40;
export const MUSIC_ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.webm'] as const;
export const SEARCH_SUGGEST_MAX_RESULTS = 8;
export const SEARCH_SUGGEST_MIN_LEN = 2;
export const SEARCH_SUGGEST_MAX_LEN = 50;
export const ADMIN_ORDERS_MAX_ROWS = 500;

export const ORDER_ID_PREFIX = 'PC-';
export const ORDER_ID_RANDOM_LENGTH = 10;
export const ORDER_ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // excludes I, L, O, U
export const ORDER_ID_REGEX = /^PC-[A-HJKMNP-TV-Z0-9]{10}$/;

export const PRODUCT_ID_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const PRODUCT_ID_MAX_LEN = 80;
export const SERIES_ID_REGEX = /^[A-Za-z0-9-]{2,60}$/;
export const LEGACY_CPU_ID_REGEX = /^C[0-9]{2,4}$/;

export const VN_PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;
export const FULL_NAME_MIN_LEN = 2;
export const FULL_NAME_MAX_LEN = 50;
export const STREET_MIN_LEN = 10;
export const STREET_MAX_LEN = 200;
export const NOTE_MAX_LEN = 300;
export const MAX_PRICE_VND = 1_000_000_000;

export const PSU_BASE_SYSTEM_W = 100;
export const PSU_HEADROOM_FACTOR = 1.25;
export const PSU_TIERS_W = [450, 550, 650, 750, 850, 1000, 1200] as const;

export const RATE_LIMIT_MAX_FAILURES = 5;
export const RATE_LIMIT_WINDOW_MINUTES = 15;
export const RATE_LIMIT_RETENTION_HOURS = 24;

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const AUTH_SESSION_COOKIE = 'auth_session';
export const OAUTH_TX_COOKIE = 'oauth_tx';
export const ADMIN_SESSION_TTL_HOURS = 8;
export const CUSTOMER_SESSION_TTL_DAYS = 7;
export const OAUTH_TX_TTL_MINUTES = 10;
export const ORDER_TOKEN_TTL_HOURS = 24;

export const USERNAME_MIN_LEN = 3;
export const USERNAME_MAX_LEN = 30;
export const USERNAME_REGEX = /^[a-z0-9_.-]{3,30}$/;
export const PASSWORD_MIN_LEN = 6;
export const PASSWORD_MAX_LEN = 128;
export const DISPLAY_NAME_MIN_LEN = 2;
export const DISPLAY_NAME_MAX_LEN = 50;
export const RESERVED_USERNAMES = ['admin', 'root', 'system', 'coreraster'] as const;
export const MY_ORDERS_MAX_ROWS = 100;

export const WARRANTY_MONTHS = 36;
export const PACKAGING_DEFAULT = 'full_box' as const;

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_JSON_BYTES = 32 * 1024;
export const PLACEHOLDER_IMAGE_PATH = '/icons/placeholder-product.svg';

export const REVIEW_COUNTDOWN_SECONDS = 5;

export const ORDER_STAGE_VALUES = [0, 1, 2, 3, 4] as const;

export const SEED_IMAGE_PREFIX = 'seed/';
export const UPLOAD_IMAGE_PREFIX = 'uploads/';

export const ADDRESS_DATASET_DATE = '2026-09-20';
