import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Janki Design starter data. Runs once, automatically, on the first
 * `medusa db:migrate`.
 *
 * Everything below is SAMPLE data: product names, prices, stock and images are
 * placeholders to be replaced from the admin (http://localhost:9000/app) with
 * the real catalogue. Prices are in rupees and include GST.
 */

const IMAGE_BASE = `${(process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "")}/static/catalogue`
const img = (name: string) => ({ url: `${IMAGE_BASE}/${name}.jpg` })

const SIZES = ["S", "M", "L", "XL", "XXL"]
const KID_AGES = ["2-3 Y", "4-5 Y", "6-7 Y", "8-9 Y", "10-11 Y"]

type SimpleProduct = {
  title: string
  handle: string
  description: string
  category: string
  collections?: string[]
  image: string
  price: number
  sizes?: string[]
  sizeTitle?: string
  material?: string
  madeToOrderDays?: number
}

type ServiceProduct = {
  title: string
  handle: string
  description: string
  image: string
  styles: { name: string; price: number }[]
  turnaroundDays: number
}

const READY_TO_WEAR: SimpleProduct[] = [
  {
    title: "Lavender Embroidered A-Line Dress",
    handle: "lavender-embroidered-a-line-dress",
    description:
      "A soft, breathable A-line dress in a soothing lavender, with delicate thread embroidery at the yoke. Easy to wear from a day at work to an evening function.",
    category: "Kurtis & Dresses",
    collections: ["New Arrivals"],
    image: "lavender-a-line-dress",
    price: 2450,
    material: "Cotton blend",
  },
  {
    title: "Mustard Chikankari Straight Kurti",
    handle: "mustard-chikankari-straight-kurti",
    description:
      "A straight-cut kurti in warm mustard with hand chikankari detailing. Pairs with palazzos, cigarette pants or jeans.",
    category: "Kurtis & Dresses",
    image: "mustard-chikankari-kurti",
    price: 1650,
    material: "Cotton",
  },
  {
    title: "Bottle Green Anarkali with Zari Yoke",
    handle: "bottle-green-anarkali-zari-yoke",
    description:
      "A flared Anarkali in deep bottle green with a zari-worked yoke, finished with a matching dupatta. Made for festivals and family functions.",
    category: "Kurtis & Dresses",
    collections: ["Onam Edit"],
    image: "bottle-green-anarkali",
    price: 3250,
    material: "Chanderi silk",
  },
  {
    title: "Ivory Kasavu Co-ord Set",
    handle: "ivory-kasavu-co-ord-set",
    description:
      "A modern take on Kerala kasavu: a relaxed top and straight pants in ivory with gold borders. Our most-loved Onam look.",
    category: "Co-ord Sets",
    collections: ["Onam Edit", "New Arrivals"],
    image: "ivory-kasavu-coord",
    price: 2850,
    material: "Kerala cotton with kasavu border",
  },
  {
    title: "Rust Printed Cotton Co-ord Set",
    handle: "rust-printed-cotton-co-ord-set",
    description:
      "A breezy printed co-ord set in rust, cut for Kerala weather. Wear it together or style the pieces separately.",
    category: "Co-ord Sets",
    image: "rust-cotton-coord",
    price: 1950,
    material: "Mul cotton",
  },
  {
    title: "Kasavu Set Saree with Stitched Blouse",
    handle: "kasavu-set-saree-stitched-blouse",
    description:
      "A traditional Kerala set saree with a ready-stitched designer blouse in your size. Tell us your measurements or visit the studio for a perfect fit.",
    category: "Festive & Onam",
    collections: ["Onam Edit"],
    image: "kasavu-set-saree",
    price: 4500,
    sizeTitle: "Blouse size",
    material: "Kerala cotton, kasavu zari",
  },
  {
    title: "Wine Velvet Reception Gown",
    handle: "wine-velvet-reception-gown",
    description:
      "A draped wine velvet gown with a pleated bodice and flowing trail, made to order for receptions and engagements. Final fitting at our Ernakulam studio.",
    category: "Bridal",
    collections: ["Bridal Couture"],
    image: "wine-velvet-gown",
    price: 18500,
    material: "Velvet with shimmer finish",
    madeToOrderDays: 21,
  },
  {
    title: "Girls Pattu Pavada – Onam Special",
    handle: "girls-pattu-pavada-onam",
    description:
      "A traditional silk pattu pavada and blouse for girls, in rich red with a gold border. Comfortable lining for all-day wear.",
    category: "Kids",
    collections: ["Onam Edit"],
    image: "kids-pattu-pavada",
    price: 1850,
    sizes: KID_AGES,
    sizeTitle: "Age",
    material: "Art silk with zari border",
  },
  {
    title: "Boys Kurta & Mundu Set",
    handle: "boys-kurta-mundu-set",
    description:
      "A cream cotton kurta with a kasavu mundu for boys. Soft, festive and easy to wear.",
    category: "Kids",
    collections: ["Onam Edit"],
    image: "boys-kurta-mundu",
    price: 1450,
    sizes: KID_AGES,
    sizeTitle: "Age",
    material: "Cotton",
  },
]

/**
 * Custom stitching is sold as a service: the customer pays online and adds
 * measurement and design details, which are saved on the order line item.
 * Inventory is not tracked for these.
 */
const STITCHING_SERVICES: ServiceProduct[] = [
  {
    title: "Custom Blouse Stitching",
    handle: "custom-blouse-stitching",
    description:
      "Send us your fabric or choose from ours, and we stitch a blouse to your measurements.",
    image: "blouse-stitching",
    turnaroundDays: 7,
    styles: [
      { name: "Simple (unlined)", price: 650 },
      { name: "Lined", price: 850 },
      { name: "Princess cut", price: 1200 },
      { name: "Designer neck / collar", price: 1600 },
      { name: "Bridal with Aari work", price: 4500 },
    ],
  },
  {
    title: "Churidar & Salwar Stitching",
    handle: "churidar-salwar-stitching",
    description:
      "Churidar, salwar or palazzo sets stitched to your measurements, with neck and sleeve styles of your choice.",
    image: "churidar-stitching",
    turnaroundDays: 7,
    styles: [
      { name: "Simple", price: 550 },
      { name: "Lined", price: 750 },
      { name: "Anarkali", price: 1400 },
    ],
  },
  {
    title: "Custom Kurti Stitching",
    handle: "custom-kurti-stitching",
    description:
      "Everyday or festive kurtis stitched to fit. Share a reference photo and we will match the style.",
    image: "kurti-stitching",
    turnaroundDays: 5,
    styles: [
      { name: "Straight", price: 500 },
      { name: "A-line", price: 650 },
      { name: "Designer", price: 950 },
    ],
  },
  {
    title: "Pattu Pavada Stitching (Kids)",
    handle: "pattu-pavada-stitching",
    description:
      "Traditional pattu pavada and blouse stitched for girls from your fabric, with lining and adjustable fit so it lasts longer.",
    image: "pavada-stitching",
    turnaroundDays: 7,
    styles: [{ name: "Pavada & blouse", price: 900 }],
  },
  {
    title: "Saree Finishing",
    handle: "saree-finishing",
    description:
      "Fall and pico, tassels, or professional pre-pleating so your saree is ready to wear in minutes.",
    image: "saree-finishing",
    turnaroundDays: 3,
    styles: [
      { name: "Fall & pico", price: 150 },
      { name: "Tassels (kuchu)", price: 350 },
      { name: "Pre-pleating", price: 450 },
    ],
  },
  {
    title: "Alterations & Re-fitting",
    handle: "alterations-re-fitting",
    description:
      "Taking in, letting out, length changes and re-fitting for outfits bought anywhere. Final price confirmed at the studio.",
    image: "alterations",
    turnaroundDays: 3,
    styles: [
      { name: "Basic alteration", price: 200 },
      { name: "Full re-fitting", price: 600 },
    ],
  },
]

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  const cashfreeEnabled = Boolean(
    process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET
  )

  logger.info("Seeding Janki Design store...")

  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Janki Design Online",
          description: "jankidesign.com storefront",
        },
      ],
    },
  })

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Storefront",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  })

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableApiKey.id, add: [salesChannel.id] },
  })

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Janki Design",
          supported_currencies: [
            { currency_code: "inr", is_default: true, is_tax_inclusive: true },
          ],
          default_sales_channel_id: salesChannel.id,
        },
      ],
    },
  })

  logger.info("Seeding region: India (INR, prices include GST)")
  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "India",
          currency_code: "inr",
          countries: ["in"],
          is_tax_inclusive: true,
          automatic_taxes: true,
          payment_providers: [
            "pp_system_default",
            ...(cashfreeEnabled ? ["pp_cashfree_cashfree"] : []),
          ],
        },
      ],
    },
  })

  // GST on apparel depends on the sale value. 5% is used as the default here;
  // review with your accountant and add rate rules in the admin as needed.
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "in",
        provider_id: "tp_system",
        default_tax_rate: { rate: 5, code: "GST5", name: "GST 5%" },
      },
    ],
  })

  logger.info("Seeding studio location and delivery options...")
  const {
    result: [studio],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Janki Design Studio, Ernakulam",
          address: {
            address_1: "Janki Design",
            city: "Kochi",
            province: "Kerala",
            country_code: "IN",
          },
        },
      ],
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: studio.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfiles[0]

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Janki Design deliveries",
    type: "shipping",
    service_zones: [
      {
        name: "India",
        geo_zones: [{ country_code: "in", type: "country" }],
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: studio.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  const zoneId = fulfillmentSet.service_zones[0].id
  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard delivery (India)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Delivered in 4-7 working days after dispatch.",
          code: "standard",
        },
        prices: [
          { currency_code: "inr", amount: 99 },
          { region_id: region.id, amount: 99 },
        ],
        rules: storeRules,
      },
      {
        name: "Express delivery (Kerala)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Delivered in 1-2 working days within Kerala.",
          code: "express",
        },
        prices: [
          { currency_code: "inr", amount: 199 },
          { region_id: region.id, amount: 199 },
        ],
        rules: storeRules,
      },
      {
        name: "Collect from studio (Ernakulam)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Studio pickup",
          description: "We will WhatsApp you when your order is ready.",
          code: "pickup",
        },
        prices: [
          { currency_code: "inr", amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: storeRules,
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: studio.id, add: [salesChannel.id] },
  })

  logger.info("Seeding categories and collections...")
  const categoryNames = [
    { name: "Bridal", handle: "bridal" },
    { name: "Kurtis & Dresses", handle: "kurtis-dresses" },
    { name: "Co-ord Sets", handle: "co-ord-sets" },
    { name: "Festive & Onam", handle: "festive" },
    { name: "Kids", handle: "kids" },
    { name: "Custom Stitching", handle: "custom-stitching" },
  ]
  const { result: categories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: categoryNames.map((c) => ({
        ...c,
        is_active: true,
      })),
    },
  })
  const categoryId = (name: string) =>
    categories.find((c) => c.name === name)!.id

  const { result: collections } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [
        { title: "Bridal Couture", handle: "bridal-couture" },
        { title: "Onam Edit", handle: "onam-edit" },
        { title: "New Arrivals", handle: "new-arrivals" },
      ],
    },
  })
  const collectionId = (title?: string) =>
    title ? collections.find((c) => c.title === title)?.id : undefined

  logger.info("Seeding ready-to-wear products...")
  await createProductsWorkflow(container).run({
    input: {
      products: READY_TO_WEAR.map((p) => {
        const sizes = p.sizes ?? SIZES
        const optionTitle = p.sizeTitle ?? "Size"
        return {
          title: p.title,
          handle: p.handle,
          description: p.description,
          status: ProductStatus.PUBLISHED,
          category_ids: [categoryId(p.category)],
          collection_id: collectionId(p.collections?.[0]),
          material: p.material,
          origin_country: "in",
          shipping_profile_id: shippingProfile.id,
          thumbnail: img(p.image).url,
          images: [img(p.image)],
          metadata: {
            sample: true,
            ...(p.madeToOrderDays
              ? { made_to_order_days: p.madeToOrderDays }
              : {}),
          },
          options: [{ title: optionTitle, values: sizes }],
          variants: sizes.map((size) => ({
            title: size,
            sku: `${p.handle}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
            options: { [optionTitle]: size },
            manage_inventory: true,
            prices: [{ amount: p.price, currency_code: "inr" }],
          })),
          sales_channels: [{ id: salesChannel.id }],
        }
      }),
    },
  })

  logger.info("Seeding custom stitching services...")
  await createProductsWorkflow(container).run({
    input: {
      products: STITCHING_SERVICES.map((s) => ({
        title: s.title,
        handle: s.handle,
        description: s.description,
        status: ProductStatus.PUBLISHED,
        category_ids: [categoryId("Custom Stitching")],
        shipping_profile_id: shippingProfile.id,
        thumbnail: img(s.image).url,
        images: [img(s.image)],
        // The storefront shows the measurement & design form when it sees this.
        metadata: {
          sample: true,
          stitching_service: true,
          turnaround_days: s.turnaroundDays,
        },
        options: [{ title: "Style", values: s.styles.map((x) => x.name) }],
        variants: s.styles.map((style) => ({
          title: style.name,
          sku: `STITCH-${s.handle}-${style.name}`
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "-"),
          options: { Style: style.name },
          manage_inventory: false,
          prices: [{ amount: style.price, currency_code: "inr" }],
        })),
        sales_channels: [{ id: salesChannel.id }],
      })),
    },
  })

  logger.info("Seeding stock levels (sample: 10 of each size)...")
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: studio.id,
        stocked_quantity: 10,
        inventory_item_id: item.id,
      })),
    },
  })

  logger.info("Seeding welcome offer WELCOME10...")
  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: "WELCOME10",
          type: "standard",
          status: "active",
          is_automatic: false,
          application_method: {
            type: "percentage",
            target_type: "order",
            allocation: "across",
            value: 10,
            currency_code: "inr",
          },
        },
      ],
    },
  })

  logger.info(
    `Janki Design seed complete. Storefront publishable key: ${publishableApiKey.token}`
  )
}
