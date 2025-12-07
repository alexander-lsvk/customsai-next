import Stripe from "stripe";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env.local") });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const plans = [
  {
    name: "Growth",
    description: "Perfect for small brokers getting started - 300 classifications/month",
    price: 4990, // THB
    envKey: "STRIPE_GROWTH_PRICE_ID",
  },
  {
    name: "Professional",
    description: "For growing teams with higher volume - 1,000 classifications/month",
    price: 9990, // THB
    envKey: "STRIPE_PROFESSIONAL_PRICE_ID",
  },
  {
    name: "Business",
    description: "Advanced features for large operations - 3,000 classifications/month",
    price: 24990, // THB
    envKey: "STRIPE_BUSINESS_PRICE_ID",
  },
];

async function createProducts() {
  console.log("Creating Stripe products and prices...\n");

  const envLines = [];

  for (const plan of plans) {
    // Create the product
    const product = await stripe.products.create({
      name: `Customs AI - ${plan.name}`,
      description: plan.description,
    });

    console.log(`Created product: ${product.name} (${product.id})`);

    // Create the price with 7-day trial
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price * 100, // Stripe uses smallest currency unit (satang for THB)
      currency: "thb",
      recurring: {
        interval: "month",
        trial_period_days: 7,
      },
    });

    console.log(`Created price: ${price.id} (฿${plan.price}/month with 7-day trial)\n`);

    envLines.push(`${plan.envKey}=${price.id}`);
  }

  console.log("\n=== Add these to your .env.local and Vercel ===\n");
  envLines.forEach((line) => console.log(line));
  console.log("\n");
}

createProducts().catch(console.error);
