export type Role = 'CUSTOMER' | 'ADMIN';
export type Gender = 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';
export type SortOption = 'newest' | 'price_asc' | 'price_desc';
export type PaymentMethod = 'COD' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PAID';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  onboarded: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  gender: Gender | null;
  children: Category[];
}

export interface ProductCard {
  id: string;
  title: string;
  slug: string;
  brand: string;
  gender: Gender;
  basePrice: number;
  discountPrice: number | null;
  image: string;
  sizes: string[];
  colors: string[];
}

export interface ProductImage {
  id: string;
  url: string;
  key: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  brand: string;
  gender: Gender;
  basePrice: number;
  discountPrice: number | null;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductFilters {
  sizes: string[];
  colors: { name: string; hex: string }[];
  minPrice: number;
  maxPrice: number;
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    size: string;
    color: string;
    stock: number;
    product: {
      id: string;
      title: string;
      slug: string;
      basePrice: number;
      discountPrice: number | null;
      image: string;
    };
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItemSummary {
  productTitle: string;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  items: OrderItemSummary[];
}

export interface OrderDetailItem {
  id: string;
  productTitle: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
  address: Address;
  items: OrderDetailItem[];
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: OrderSummary[];
}
