import { PrismaClient, Gender } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Real product photos from DummyJSON's open demo-commerce catalog (cdn.dummyjson.com). */
function dummy(category: string, name: string, count = 2) {
  return Array.from({ length: count }, (_, i) => `https://cdn.dummyjson.com/product-images/${category}/${name}/${i + 1}.webp`);
}

/** Real, freely-licensed Unsplash photos, used where DummyJSON has no matching product type. */
function unsplash(...ids: string[]) {
  return ids.map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=1000&q=80`);
}

function toImageRows(urls: string[]) {
  return urls.map((url, i) => ({ url, key: `seed/${encodeURIComponent(url)}`, sortOrder: i }));
}

async function main() {
  // ---------- Admin user ----------
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@clothify.com' },
    update: {},
    create: {
      email: 'admin@clothify.com',
      passwordHash: adminPasswordHash,
      name: 'Clothify Admin',
      role: 'ADMIN',
      onboarded: true,
    },
  });

  // ---------- Category tree ----------
  type CategorySeed = {
    name: string;
    slug: string;
    gender: Gender;
    imageUrl: string;
    children: { name: string; slug: string }[];
  };

  const tree: CategorySeed[] = [
    {
      name: 'Men',
      slug: 'men',
      gender: Gender.MEN,
      imageUrl: unsplash('1619603364937-8d7af41ef206')[0],
      children: [
        { name: 'Topwear', slug: 'men-topwear' },
        { name: 'Bottomwear', slug: 'men-bottomwear' },
        { name: 'Footwear', slug: 'men-footwear' },
      ],
    },
    {
      name: 'Women',
      slug: 'women',
      gender: Gender.WOMEN,
      imageUrl: unsplash('1613915617430-8ab0fd7c6baf')[0],
      children: [
        { name: 'Topwear', slug: 'women-topwear' },
        { name: 'Bottomwear', slug: 'women-bottomwear' },
        { name: 'Footwear', slug: 'women-footwear' },
        { name: 'Ethnic', slug: 'women-ethnic' },
      ],
    },
    {
      name: 'Kids',
      slug: 'kids',
      gender: Gender.KIDS,
      imageUrl: unsplash('1670014541811-9b0ec280ed60')[0],
      children: [
        { name: 'Boys', slug: 'kids-boys' },
        { name: 'Girls', slug: 'kids-girls' },
      ],
    },
  ];

  const categoryIds: Record<string, string> = {};

  for (let i = 0; i < tree.length; i++) {
    const top = tree[i];
    const parent = await prisma.category.upsert({
      where: { slug: top.slug },
      update: { imageUrl: top.imageUrl },
      create: { name: top.name, slug: top.slug, gender: top.gender, imageUrl: top.imageUrl, sortOrder: i },
    });
    categoryIds[top.slug] = parent.id;

    for (let j = 0; j < top.children.length; j++) {
      const child = top.children[j];
      const created = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          name: child.name,
          slug: child.slug,
          gender: top.gender,
          parentId: parent.id,
          sortOrder: j,
        },
      });
      categoryIds[child.slug] = created.id;
    }
  }

  // ---------- Products ----------
  // Images are real product photos (DummyJSON's open demo-commerce catalog) or real,
  // freely-licensed Unsplash photos — not random/unrelated placeholders.
  const products = [
    // ---- Men / Topwear (real shirt photos) ----
    {
      slug: 'blue-black-check-shirt',
      title: 'Blue & Black Check Shirt',
      description: 'A classic check-pattern shirt in breathable cotton, equally at home at the office or on the weekend.',
      brand: 'Clothify Basics',
      gender: Gender.MEN,
      category: 'men-topwear',
      basePrice: 1499,
      discountPrice: 1199,
      images: dummy('mens-shirts', 'blue-&-black-check-shirt', 3),
      variants: [
        { size: 'S', color: 'Blue', colorHex: '#1E3A8A', sku: 'MTS-BBC-S-BLU', stock: 22 },
        { size: 'M', color: 'Blue', colorHex: '#1E3A8A', sku: 'MTS-BBC-M-BLU', stock: 28 },
        { size: 'L', color: 'Black', colorHex: '#111827', sku: 'MTS-BBC-L-BLK', stock: 18 },
      ],
    },
    {
      slug: 'man-plaid-shirt',
      title: 'Plaid Flannel Shirt',
      description: 'A soft brushed-cotton plaid shirt with a relaxed fit, perfect for layering through winter.',
      brand: 'Urban Thread',
      gender: Gender.MEN,
      category: 'men-topwear',
      basePrice: 1799,
      discountPrice: 1399,
      images: dummy('mens-shirts', 'man-plaid-shirt', 3),
      variants: [
        { size: 'M', color: 'Red Check', colorHex: '#7F1D1D', sku: 'MTS-PLD-M-RED', stock: 16 },
        { size: 'L', color: 'Red Check', colorHex: '#7F1D1D', sku: 'MTS-PLD-L-RED', stock: 14 },
        { size: 'XL', color: 'Green Check', colorHex: '#166534', sku: 'MTS-PLD-XL-GRN', stock: 10 },
      ],
    },
    {
      slug: 'man-short-sleeve-shirt',
      title: 'Short Sleeve Summer Shirt',
      description: 'A lightweight short-sleeve shirt in airy cotton, built for warm days and easy care.',
      brand: 'Clothify Basics',
      gender: Gender.MEN,
      category: 'men-topwear',
      basePrice: 999,
      discountPrice: 799,
      images: dummy('mens-shirts', 'man-short-sleeve-shirt', 3),
      variants: [
        { size: 'S', color: 'White', colorHex: '#F9FAFB', sku: 'MTS-SSS-S-WHT', stock: 20 },
        { size: 'M', color: 'White', colorHex: '#F9FAFB', sku: 'MTS-SSS-M-WHT', stock: 24 },
        { size: 'L', color: 'Sky Blue', colorHex: '#38BDF8', sku: 'MTS-SSS-L-SKY', stock: 18 },
      ],
    },
    {
      slug: 'men-check-shirt',
      title: 'Men Check Shirt',
      description: 'A tailored check shirt with a structured collar, made for a smart-casual look.',
      brand: 'Urban Thread',
      gender: Gender.MEN,
      category: 'men-topwear',
      basePrice: 1599,
      discountPrice: null,
      images: dummy('mens-shirts', 'men-check-shirt', 2),
      variants: [
        { size: 'M', color: 'Grey Check', colorHex: '#6B7280', sku: 'MTS-MCS-M-GRY', stock: 15 },
        { size: 'L', color: 'Grey Check', colorHex: '#6B7280', sku: 'MTS-MCS-L-GRY', stock: 12 },
      ],
    },
    // ---- Men / Bottomwear (real denim photos) ----
    {
      slug: 'slim-straight-denim-jeans',
      title: 'Slim Straight Denim Jeans',
      description: 'Stretch denim jeans with a slim straight leg that moves with you all day.',
      brand: 'Denim Co.',
      gender: Gender.MEN,
      category: 'men-bottomwear',
      basePrice: 1999,
      discountPrice: 1599,
      images: unsplash('1714143136372-ddaf8b606da7', '1715758890151-2c15d5d482aa'),
      variants: [
        { size: 'M', color: 'Indigo', colorHex: '#3730A3', sku: 'MBW-SSD-M-IND', stock: 20 },
        { size: 'L', color: 'Indigo', colorHex: '#3730A3', sku: 'MBW-SSD-L-IND', stock: 22 },
        { size: 'XL', color: 'Black Denim', colorHex: '#1F2937', sku: 'MBW-SSD-XL-BLK', stock: 14 },
      ],
    },
    {
      slug: 'relaxed-fit-denim-jeans',
      title: 'Relaxed Fit Denim Jeans',
      description: 'A relaxed, comfortable fit through the hip and thigh in durable washed denim.',
      brand: 'Denim Co.',
      gender: Gender.MEN,
      category: 'men-bottomwear',
      basePrice: 1899,
      discountPrice: null,
      images: unsplash('1721637222188-fa7bf56ceaf5', '1714143164072-7646ef5cb24d'),
      variants: [
        { size: 'M', color: 'Mid Blue', colorHex: '#2563EB', sku: 'MBW-RFD-M-MID', stock: 16 },
        { size: 'L', color: 'Mid Blue', colorHex: '#2563EB', sku: 'MBW-RFD-L-MID', stock: 14 },
      ],
    },
    // ---- Men / Footwear (real sneaker/shoe photos) ----
    {
      slug: 'air-jordan-1-red-black',
      title: 'Air Jordan 1 Red & Black',
      description: 'An iconic high-top basketball sneaker in a bold red and black colourway.',
      brand: 'Nike',
      gender: Gender.MEN,
      category: 'men-footwear',
      basePrice: 12999,
      discountPrice: 10999,
      images: dummy('mens-shoes', 'nike-air-jordan-1-red-and-black', 3),
      variants: [
        { size: 'M', color: 'Red/Black', colorHex: '#B91C1C', sku: 'MFW-AJ1-M-RED', stock: 10 },
        { size: 'L', color: 'Red/Black', colorHex: '#B91C1C', sku: 'MFW-AJ1-L-RED', stock: 8 },
      ],
    },
    {
      slug: 'puma-future-rider-trainers',
      title: 'Future Rider Trainers',
      description: 'Retro-inspired low-top trainers with a chunky sole and cushioned comfort.',
      brand: 'Puma',
      gender: Gender.MEN,
      category: 'men-footwear',
      basePrice: 5999,
      discountPrice: 4799,
      images: dummy('mens-shoes', 'puma-future-rider-trainers', 3),
      variants: [
        { size: 'M', color: 'White', colorHex: '#F3F4F6', sku: 'MFW-PFR-M-WHT', stock: 14 },
        { size: 'L', color: 'White', colorHex: '#F3F4F6', sku: 'MFW-PFR-L-WHT', stock: 12 },
      ],
    },
    {
      slug: 'sports-sneakers-off-white-red',
      title: 'Sport Sneakers Off-White & Red',
      description: 'Lightweight running sneakers with breathable mesh and a cushioned midsole.',
      brand: 'SprintFlex',
      gender: Gender.MEN,
      category: 'men-footwear',
      basePrice: 3999,
      discountPrice: 2999,
      images: dummy('mens-shoes', 'sports-sneakers-off-white-&-red', 3),
      variants: [
        { size: 'M', color: 'Off-White', colorHex: '#F5F5F4', sku: 'MFW-SOW-M-OFW', stock: 16 },
        { size: 'L', color: 'Off-White', colorHex: '#F5F5F4', sku: 'MFW-SOW-L-OFW', stock: 12 },
      ],
    },
    // ---- Women / Dresses (real gown/dress photos, listed under Topwear) ----
    {
      slug: 'black-womens-gown',
      title: "Black Women's Gown",
      description: 'An elegant floor-length gown in flowing fabric, made for evening occasions.',
      brand: 'Petal & Co.',
      gender: Gender.WOMEN,
      category: 'women-topwear',
      basePrice: 4999,
      discountPrice: 3999,
      images: dummy('womens-dresses', "black-women's-gown", 3),
      variants: [
        { size: 'S', color: 'Black', colorHex: '#111827', sku: 'WTW-BWG-S-BLK', stock: 8 },
        { size: 'M', color: 'Black', colorHex: '#111827', sku: 'WTW-BWG-M-BLK', stock: 10 },
      ],
    },
    {
      slug: 'dress-pea',
      title: 'Pea Midi Dress',
      description: 'A fitted midi dress with a flattering silhouette, easy to dress up or down.',
      brand: 'Urban Thread',
      gender: Gender.WOMEN,
      category: 'women-topwear',
      basePrice: 2499,
      discountPrice: 1999,
      images: dummy('womens-dresses', 'dress-pea', 3),
      variants: [
        { size: 'S', color: 'Teal', colorHex: '#0F766E', sku: 'WTW-DPA-S-TEA', stock: 14 },
        { size: 'M', color: 'Teal', colorHex: '#0F766E', sku: 'WTW-DPA-M-TEA', stock: 12 },
        { size: 'L', color: 'Teal', colorHex: '#0F766E', sku: 'WTW-DPA-L-TEA', stock: 10 },
      ],
    },
    // ---- Women / Bottomwear (real jeans photos) ----
    {
      slug: 'high-rise-skinny-jeans',
      title: 'High-Rise Skinny Jeans',
      description: 'A flattering high-rise skinny fit in comfortable stretch denim.',
      brand: 'Denim Co.',
      gender: Gender.WOMEN,
      category: 'women-bottomwear',
      basePrice: 1699,
      discountPrice: 1299,
      images: unsplash('1541099649105-f69ad21f3246', '1475178626620-a4d074967452'),
      variants: [
        { size: 'S', color: 'Black', colorHex: '#111827', sku: 'WBW-HRS-S-BLK', stock: 18 },
        { size: 'M', color: 'Black', colorHex: '#111827', sku: 'WBW-HRS-M-BLK', stock: 16 },
        { size: 'L', color: 'Mid Blue', colorHex: '#2563EB', sku: 'WBW-HRS-L-MID', stock: 12 },
      ],
    },
    {
      slug: 'straight-fit-denim-jeans-women',
      title: 'Straight Fit Denim Jeans',
      description: 'A timeless straight-leg jean in soft washed denim, true to size.',
      brand: 'Denim Co.',
      gender: Gender.WOMEN,
      category: 'women-bottomwear',
      basePrice: 1599,
      discountPrice: null,
      images: unsplash('1576995853123-5a10305d93c0', '1721637286605-ae9be19d681f'),
      variants: [
        { size: 'S', color: 'Light Blue', colorHex: '#93C5FD', sku: 'WBW-SFD-S-LBL', stock: 14 },
        { size: 'M', color: 'Light Blue', colorHex: '#93C5FD', sku: 'WBW-SFD-M-LBL', stock: 14 },
      ],
    },
    // ---- Women / Footwear (real shoe photos) ----
    {
      slug: 'calvin-klein-heel-shoes',
      title: 'Classic Heel Shoes',
      description: 'A timeless block-heel shoe in smooth faux leather, dressy enough for any evening.',
      brand: 'Calvin Klein',
      gender: Gender.WOMEN,
      category: 'women-footwear',
      basePrice: 6499,
      discountPrice: 5199,
      images: dummy('womens-shoes', 'calvin-klein-heel-shoes', 3),
      variants: [
        { size: 'S', color: 'Black', colorHex: '#111827', sku: 'WFW-CKH-S-BLK', stock: 10 },
        { size: 'M', color: 'Black', colorHex: '#111827', sku: 'WFW-CKH-M-BLK', stock: 8 },
      ],
    },
    {
      slug: 'golden-shoes-woman',
      title: 'Golden Party Heels',
      description: 'Statement metallic heels designed to catch the light at every party.',
      brand: 'Petal & Co.',
      gender: Gender.WOMEN,
      category: 'women-footwear',
      basePrice: 2999,
      discountPrice: 2399,
      images: dummy('womens-shoes', 'golden-shoes-woman', 3),
      variants: [
        { size: 'S', color: 'Gold', colorHex: '#D4AF37', sku: 'WFW-GSW-S-GLD', stock: 12 },
        { size: 'M', color: 'Gold', colorHex: '#D4AF37', sku: 'WFW-GSW-M-GLD', stock: 10 },
      ],
    },
    {
      slug: 'red-shoes-women',
      title: 'Red Strap Heels',
      description: 'Vibrant red strappy heels with a cushioned footbed for all-day wear.',
      brand: 'SprintFlex',
      gender: Gender.WOMEN,
      category: 'women-footwear',
      basePrice: 2199,
      discountPrice: null,
      images: dummy('womens-shoes', 'red-shoes', 2),
      variants: [
        { size: 'S', color: 'Red', colorHex: '#B91C1C', sku: 'WFW-RSH-S-RED', stock: 11 },
        { size: 'M', color: 'Red', colorHex: '#B91C1C', sku: 'WFW-RSH-M-RED', stock: 9 },
      ],
    },
    // ---- Women / Ethnic (real kurta photos) ----
    {
      slug: 'embroidered-anarkali-kurta',
      title: 'Embroidered Anarkali Kurta',
      description: 'A floor-length Anarkali kurta with delicate embroidery, perfect for festive occasions.',
      brand: 'Ethnic Weave',
      gender: Gender.WOMEN,
      category: 'women-ethnic',
      basePrice: 2999,
      discountPrice: 2399,
      images: unsplash('1708534246051-7f47b279e94b', '1708534419572-6e6614a53ca1'),
      variants: [
        { size: 'S', color: 'Maroon', colorHex: '#7F1D1D', sku: 'WET-EAK-S-MAR', stock: 10 },
        { size: 'M', color: 'Maroon', colorHex: '#7F1D1D', sku: 'WET-EAK-M-MAR', stock: 12 },
        { size: 'L', color: 'Teal', colorHex: '#115E59', sku: 'WET-EAK-L-TEA', stock: 8 },
      ],
    },
    {
      slug: 'printed-straight-kurta',
      title: 'Printed Straight Kurta',
      description: 'A breathable cotton kurta in an everyday straight cut with a block print.',
      brand: 'Ethnic Weave',
      gender: Gender.WOMEN,
      category: 'women-ethnic',
      basePrice: 1499,
      discountPrice: 1199,
      images: unsplash('1533128361669-69c065857a13', '1708534246055-d7b149acb731'),
      variants: [
        { size: 'S', color: 'Mustard', colorHex: '#CA8A04', sku: 'WET-PSK-S-MUS', stock: 16 },
        { size: 'M', color: 'Mustard', colorHex: '#CA8A04', sku: 'WET-PSK-M-MUS', stock: 14 },
      ],
    },
    // ---- Kids / Girls (real frock/dress photos) ----
    {
      slug: 'blue-frock',
      title: 'Blue Frock',
      description: 'A cheerful blue frock with a flared hem, easy to move and play in.',
      brand: 'Clothify Kids',
      gender: Gender.KIDS,
      category: 'kids-girls',
      basePrice: 899,
      discountPrice: 699,
      images: dummy('tops', 'blue-frock', 3),
      variants: [
        { size: 'S', color: 'Blue', colorHex: '#1E3A8A', sku: 'KGL-BLF-S-BLU', stock: 18 },
        { size: 'M', color: 'Blue', colorHex: '#1E3A8A', sku: 'KGL-BLF-M-BLU', stock: 16 },
      ],
    },
    {
      slug: 'girl-summer-dress',
      title: 'Girls Summer Dress',
      description: 'A light cotton dress with a playful print, perfect for warm-weather days out.',
      brand: 'Clothify Kids',
      gender: Gender.KIDS,
      category: 'kids-girls',
      basePrice: 799,
      discountPrice: 599,
      images: dummy('tops', 'girl-summer-dress', 3),
      variants: [
        { size: 'S', color: 'Yellow', colorHex: '#EAB308', sku: 'KGL-GSD-S-YEL', stock: 20 },
        { size: 'M', color: 'Yellow', colorHex: '#EAB308', sku: 'KGL-GSD-M-YEL', stock: 18 },
      ],
    },
    {
      slug: 'short-frock',
      title: 'Short Party Frock',
      description: 'A twirly party frock with a ruffled hem, perfect for birthdays and celebrations.',
      brand: 'Clothify Kids',
      gender: Gender.KIDS,
      category: 'kids-girls',
      basePrice: 1299,
      discountPrice: 999,
      images: dummy('tops', 'short-frock', 3),
      variants: [
        { size: 'S', color: 'Pink', colorHex: '#DB2777', sku: 'KGL-SHF-S-PNK', stock: 15 },
        { size: 'M', color: 'Pink', colorHex: '#DB2777', sku: 'KGL-SHF-M-PNK', stock: 12 },
        { size: 'L', color: 'Purple', colorHex: '#6D28D9', sku: 'KGL-SHF-L-PUR', stock: 10 },
      ],
    },
    {
      slug: 'tartan-dress',
      title: 'Tartan Check Dress',
      description: 'A classic tartan check dress with a collared yoke, dressy enough for any occasion.',
      brand: 'Clothify Kids',
      gender: Gender.KIDS,
      category: 'kids-girls',
      basePrice: 1099,
      discountPrice: null,
      images: dummy('tops', 'tartan-dress', 3),
      variants: [
        { size: 'S', color: 'Red Tartan', colorHex: '#991B1B', sku: 'KGL-TTD-S-RED', stock: 12 },
        { size: 'M', color: 'Red Tartan', colorHex: '#991B1B', sku: 'KGL-TTD-M-RED', stock: 10 },
      ],
    },
    // ---- Kids / Boys (real lifestyle photos) ----
    {
      slug: 'boys-casual-tshirt-shorts-set',
      title: 'Boys T-Shirt & Shorts Set',
      description: 'A relaxed, breathable co-ord set built for everyday play.',
      brand: 'Clothify Kids',
      gender: Gender.KIDS,
      category: 'kids-boys',
      basePrice: 899,
      discountPrice: 699,
      images: unsplash('1596392927852-2a18c336fb78', '1519238263530-99bdd11df2ea'),
      variants: [
        { size: 'S', color: 'Navy', colorHex: '#1E3A8A', sku: 'KBY-TSS-S-NVY', stock: 18 },
        { size: 'M', color: 'Navy', colorHex: '#1E3A8A', sku: 'KBY-TSS-M-NVY', stock: 16 },
      ],
    },
    {
      slug: 'boys-striped-polo-shirt',
      title: 'Boys Striped Polo Shirt',
      description: 'A soft cotton polo with a classic stripe, smart enough for school or play.',
      brand: 'Clothify Kids',
      gender: Gender.KIDS,
      category: 'kids-boys',
      basePrice: 699,
      discountPrice: 549,
      images: unsplash('1758782213532-bbb5fd89885e', '1681551210432-228395e59420'),
      variants: [
        { size: 'S', color: 'Red', colorHex: '#B91C1C', sku: 'KBY-SPS-S-RED', stock: 20 },
        { size: 'M', color: 'Red', colorHex: '#B91C1C', sku: 'KBY-SPS-M-RED', stock: 18 },
      ],
    },
    {
      slug: 'boys-hooded-sweatshirt',
      title: 'Boys Hooded Sweatshirt',
      description: 'A cosy fleece-lined hoodie for cooler days, with a roomy kangaroo pocket.',
      brand: 'Clothify Kids',
      gender: Gender.KIDS,
      category: 'kids-boys',
      basePrice: 1199,
      discountPrice: 949,
      images: unsplash('1566513783358-9b483cfc7042', '1656734314205-bfadf4f789c2'),
      variants: [
        { size: 'S', color: 'Grey', colorHex: '#6B7280', sku: 'KBY-BHS-S-GRY', stock: 14 },
        { size: 'M', color: 'Grey', colorHex: '#6B7280', sku: 'KBY-BHS-M-GRY', stock: 12 },
      ],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        title: product.title,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        gender: product.gender,
        basePrice: product.basePrice,
        discountPrice: product.discountPrice ?? undefined,
        categoryId: categoryIds[product.category],
        variants: { create: product.variants },
        images: { create: toImageRows(product.images) },
      },
    });
  }

  console.log('Seed complete.');
  console.log('Admin login -> email: admin@clothify.com, password: Admin@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
