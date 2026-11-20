// Declarative config for the simple admin CRUD screens (client + server safe).
// The generic API (/api/admin/resources/[resource]) builds Zod validation from these
// field definitions, and the generic admin UI renders forms + tables from them.
import { COUNTRIES } from '../countries';

export type FieldType = 'text' | 'textarea' | 'longtext' | 'int' | 'decimal' | 'bool' | 'select' | 'datetime' | 'image' | 'slug' | 'url';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  readOnlyOnEdit?: boolean;
  max?: number;
  dir?: 'rtl' | 'ltr';
}

export interface ResourceDef {
  key: string;
  model: 'collection' | 'coupon' | 'shippingRate' | 'currencyRate' | 'heroSlide' | 'page' | 'location';
  title: string;
  singular: string;
  idField: 'id' | 'code';
  fields: FieldDef[];
  columns: string[];
  orderBy: Record<string, 'asc' | 'desc'>;
  searchable?: string[];
  revalidate?: 'catalog' | 'rates';
  canCreate?: boolean;
  canDelete?: boolean;
  description?: string;
}

const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.nameEn}` }));
const currencyOptions = COUNTRIES.map((c) => ({ value: c.currency, label: c.currency }));

export const RESOURCES: Record<string, ResourceDef> = {
  collections: {
    key: 'collections',
    model: 'collection',
    title: 'Collections',
    singular: 'Collection',
    idField: 'id',
    revalidate: 'catalog',
    orderBy: { sortOrder: 'asc' },
    searchable: ['nameEn', 'nameAr', 'slug'],
    columns: ['image', 'nameEn', 'nameAr', 'slug', 'sortOrder', 'isActive'],
    description: 'Collections appear in "Shop by Collection", the shop menu and at /collection/<slug>. Lower sort order shows first.',
    fields: [
      { name: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { name: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { name: 'slug', label: 'URL slug', type: 'slug', required: true, help: 'Lowercase letters, numbers and dashes, e.g. gift-sets' },
      { name: 'descriptionEn', label: 'Description (English)', type: 'textarea' },
      { name: 'descriptionAr', label: 'Description (Arabic)', type: 'textarea', dir: 'rtl' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'sortOrder', label: 'Sort order', type: 'int' },
      { name: 'isActive', label: 'Active', type: 'bool' },
    ],
  },
  coupons: {
    key: 'coupons',
    model: 'coupon',
    title: 'Coupons',
    singular: 'Coupon',
    idField: 'id',
    orderBy: { createdAt: 'desc' },
    searchable: ['code'],
    columns: ['code', 'type', 'value', 'minOrder', 'usedCount', 'usageLimit', 'expiresAt', 'isActive'],
    description: 'PERCENT coupons take a % off the subtotal. FIXED coupons and minimum order are in KWD (converted for other currencies).',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, help: 'Customers type this at checkout (case-insensitive)' },
      { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'PERCENT', label: 'Percent (%)' }, { value: 'FIXED', label: 'Fixed amount (KWD)' }] },
      { name: 'value', label: 'Value', type: 'decimal', required: true },
      { name: 'minOrder', label: 'Minimum order (KWD)', type: 'decimal' },
      { name: 'startsAt', label: 'Starts at', type: 'datetime' },
      { name: 'expiresAt', label: 'Expires at', type: 'datetime' },
      { name: 'usageLimit', label: 'Usage limit (total)', type: 'int', help: 'Leave empty for unlimited' },
      { name: 'isActive', label: 'Active', type: 'bool' },
    ],
  },
  shipping: {
    key: 'shipping',
    model: 'shippingRate',
    title: 'Shipping rates',
    singular: 'Shipping rate',
    idField: 'id',
    orderBy: { country: 'asc' },
    columns: ['country', 'fee', 'freeShippingThreshold', 'estimatedDays', 'isActive'],
    description: 'Fees and free-shipping thresholds are in KWD and converted to the customer currency. Countries without an active rate cannot check out.',
    fields: [
      { name: 'country', label: 'Country', type: 'select', required: true, options: countryOptions },
      { name: 'fee', label: 'Fee (KWD)', type: 'decimal', required: true },
      { name: 'freeShippingThreshold', label: 'Free shipping from (KWD)', type: 'decimal', help: 'Leave empty to never offer free shipping' },
      { name: 'estimatedDays', label: 'Estimated delivery days', type: 'text', required: true, help: 'e.g. 1-2' },
      { name: 'isActive', label: 'Active', type: 'bool' },
    ],
  },
  currencies: {
    key: 'currencies',
    model: 'currencyRate',
    title: 'Currency rates',
    singular: 'Currency rate',
    idField: 'code',
    revalidate: 'rates',
    orderBy: { code: 'asc' },
    columns: ['code', 'rateFromKWD', 'updatedAt'],
    canDelete: false,
    description: 'How many units of each currency equal 1 KWD. All catalogue prices are stored in KWD and converted with these rates.',
    fields: [
      { name: 'code', label: 'Currency', type: 'select', required: true, options: currencyOptions, readOnlyOnEdit: true },
      { name: 'rateFromKWD', label: 'Rate (1 KWD =)', type: 'decimal', required: true },
    ],
  },
  'hero-slides': {
    key: 'hero-slides',
    model: 'heroSlide',
    title: 'Hero slides',
    singular: 'Hero slide',
    idField: 'id',
    revalidate: 'catalog',
    orderBy: { sortOrder: 'asc' },
    columns: ['imageDesktop', 'titleEn', 'titleAr', 'link', 'sortOrder', 'isActive'],
    description: 'Homepage slider. Both titles are displayed together, as in the original design.',
    fields: [
      { name: 'imageDesktop', label: 'Image (desktop)', type: 'image', required: true },
      { name: 'imageMobile', label: 'Image (mobile, optional)', type: 'image' },
      { name: 'titleEn', label: 'Title (English)', type: 'text', required: true },
      { name: 'titleAr', label: 'Title (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { name: 'taglineEn', label: 'Tagline (English)', type: 'text' },
      { name: 'taglineAr', label: 'Tagline (Arabic)', type: 'text', dir: 'rtl' },
      { name: 'link', label: 'Button link', type: 'url', required: true, help: 'e.g. /shop or /product/beyond-me' },
      { name: 'sortOrder', label: 'Sort order', type: 'int' },
      { name: 'isActive', label: 'Active', type: 'bool' },
    ],
  },
  pages: {
    key: 'pages',
    model: 'page',
    title: 'Content pages',
    singular: 'Page',
    idField: 'id',
    revalidate: 'catalog',
    orderBy: { slug: 'asc' },
    columns: ['slug', 'titleEn', 'titleAr', 'updatedAt'],
    canCreate: false,
    canDelete: false,
    description: 'About, Our Story and policy pages. Formatting: start a line with "## " for a heading, "- " for a bullet; leave a blank line between paragraphs.',
    fields: [
      { name: 'slug', label: 'Slug', type: 'slug', required: true, readOnlyOnEdit: true },
      { name: 'titleEn', label: 'Title (English)', type: 'text', required: true },
      { name: 'titleAr', label: 'Title (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { name: 'contentEn', label: 'Content (English)', type: 'longtext', required: true, max: 50000 },
      { name: 'contentAr', label: 'Content (Arabic)', type: 'longtext', required: true, max: 50000, dir: 'rtl' },
    ],
  },
  locations: {
    key: 'locations',
    model: 'location',
    title: 'Store locations',
    singular: 'Location',
    idField: 'id',
    revalidate: 'catalog',
    orderBy: { sortOrder: 'asc' },
    columns: ['nameEn', 'addressEn', 'phone', 'openingHours', 'isActive'],
    fields: [
      { name: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { name: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { name: 'addressEn', label: 'Address (English)', type: 'textarea', required: true },
      { name: 'addressAr', label: 'Address (Arabic)', type: 'textarea', required: true, dir: 'rtl' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'mapUrl', label: 'Google Maps link', type: 'url' },
      { name: 'openingHours', label: 'Opening hours', type: 'text', help: 'e.g. Sat–Thu 10:00–22:00' },
      { name: 'sortOrder', label: 'Sort order', type: 'int' },
      { name: 'isActive', label: 'Active', type: 'bool' },
    ],
  },
};
