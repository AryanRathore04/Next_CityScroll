import { connectDB } from "@/lib/mongodb";

// Define the sitemap structure
interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

// Get all active vendors for sitemap
async function getAllActiveVendors() {
  try {
    await connectDB();
    const User = (await import("../../models/User")).default;

    const vendors = await User.find({
      userType: "vendor",
      status: "approved",
    })
      .select("_id updatedAt")
      .lean();

    return vendors.map((vendor: any) => ({
      id: vendor._id.toString(),
      lastModified: vendor.updatedAt || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching vendors for sitemap:", error);
    return [];
  }
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://beautybook.com";

    // Get all active vendors
    const vendors = await getAllActiveVendors();

    // Define static pages
    const staticPages: SitemapEntry[] = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changefreq: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/salons`,
        lastModified: new Date(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changefreq: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/signin`,
        lastModified: new Date(),
        changefreq: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/signup`,
        lastModified: new Date(),
        changefreq: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/booking`,
        lastModified: new Date(),
        changefreq: "weekly",
        priority: 0.8,
      },
    ];

    // Generate salon pages
    const salonPages: SitemapEntry[] = vendors.map((vendor) => ({
      url: `${baseUrl}/salon/${vendor.id}`,
      lastModified: vendor.lastModified,
      changefreq: "weekly",
      priority: 0.8,
    }));

    // Combine all pages
    const allPages = [...staticPages, ...salonPages];

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified?.toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Return a minimal sitemap with just the homepage in case of error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_APP_URL || "https://beautybook.com"}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}
