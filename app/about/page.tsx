"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import {
  Leaf,
  ArrowLeft,
  Users,
  Award,
  Heart,
  Shield,
  Star,
  MapPin,
  Sparkles,
  AlertCircle,
} from "lucide-react";

// Types for better type safety
interface PlatformStat {
  icon: React.ReactNode;
  number: string;
  label: string;
}

interface CompanyValue {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
}

interface PlatformStats {
  totalCustomers: number;
  totalVendors: number;
  totalCities: number;
  averageRating: number;
}

interface CompanyStory {
  title: string;
  paragraphs: string[];
  image: string;
}

interface CompanyValueAPI {
  icon: string;
  title: string;
  description: string;
}

interface TeamMemberAPI {
  name: string;
  role: string;
  image: string;
  description: string;
  order?: number;
}

interface CompanyInfoData {
  story: CompanyStory;
  values: CompanyValueAPI[];
  team: TeamMemberAPI[];
  cta: {
    title: string;
    description: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
  };
}

// Map icon names to actual icon components
const iconMap: Record<string, React.ReactNode> = {
  Heart: <Heart className="h-8 w-8" />,
  Shield: <Shield className="h-8 w-8" />,
  Sparkles: <Sparkles className="h-8 w-8" />,
};

export default function AboutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both platform stats and company info in parallel
        const [statsResponse, companyResponse] = await Promise.all([
          fetch("/api/platform-stats"),
          fetch("/api/company-info"),
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.warn("Failed to fetch platform stats, using fallback data");
          setStats({
            totalCustomers: 25000,
            totalVendors: 500,
            totalCities: 15,
            averageRating: 4.9,
          });
        }

        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          setCompanyInfo(companyData);
        } else {
          console.warn("Failed to fetch company info, using fallback data");
          // Fallback data will be set below
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load some content. Please try again later.");

        // Use fallback data
        setStats({
          totalCustomers: 25000,
          totalVendors: 500,
          totalCities: 15,
          averageRating: 4.9,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <PageLoading />;

  // Fallback data if API fails
  const defaultValues: CompanyValue[] = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Wellness First",
      description:
        "Your health and well-being are at the center of everything we do.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Trust & Safety",
      description:
        "All our partners are verified and maintain the highest standards.",
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Premium Quality",
      description:
        "We curate only the best wellness experiences for our community.",
    },
  ];

  const defaultTeam: TeamMember[] = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      description: "10+ years in wellness industry",
    },
    {
      name: "Michael Chen",
      role: "Head of Partnerships",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      description: "Expert in business development",
    },
    {
      name: "Emily Rodriguez",
      role: "Customer Success",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      description: "Passionate about customer care",
    },
  ];

  const defaultStory: CompanyStory = {
    title: "Our Story",
    paragraphs: [
      "BeautyBook was born from a simple belief: everyone deserves access to exceptional wellness experiences. Founded in 2020, we started with a mission to bridge the gap between wellness seekers and premium service providers.",
      "What began as a small platform has grown into a trusted community of over 25,000 customers and 500+ partner venues across 15 cities. We've facilitated countless moments of self-care, relaxation, and transformation.",
      "Today, we continue to innovate and expand, always keeping our core values at heart: quality, trust, and the belief that wellness should be accessible to all.",
    ],
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center",
  };

  // Use fetched data or fallback
  const values =
    companyInfo?.values.map((v) => ({
      ...v,
      icon: iconMap[v.icon] || <Heart className="h-8 w-8" />,
    })) || defaultValues;

  const team = companyInfo?.team || defaultTeam;
  const story = companyInfo?.story || defaultStory;
  const cta = companyInfo?.cta || {
    title: "Ready to Start Your Wellness Journey?",
    description: "Join thousands who trust BeautyBook for their wellness needs",
    primaryButtonText: "Explore Services",
    primaryButtonLink: "/salons",
    secondaryButtonText: "Become a Partner",
    secondaryButtonLink: "/signup?type=vendor",
  };

  const platformStats: PlatformStat[] = stats
    ? [
        {
          icon: <Users className="h-6 w-6" />,
          number: `${(stats.totalCustomers / 1000).toFixed(0)}K+`,
          label: "Happy Customers",
        },
        {
          icon: <MapPin className="h-6 w-6" />,
          number: `${stats.totalVendors}+`,
          label: "Partner Venues",
        },
        {
          icon: <Award className="h-6 w-6" />,
          number: `${stats.totalCities}+`,
          label: "Cities",
        },
        {
          icon: <Star className="h-6 w-6" />,
          number: stats.averageRating.toFixed(1),
          label: "Average Rating",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading text-foreground tracking-wide">
                BeautyBook
              </span>
            </Link>
            <Button
              variant="ghost"
              onClick={() => router.push("/" as Route)}
              className="flex items-center gap-2 font-body text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-heading text-foreground mb-6">
            About BeautyBook
          </h1>
          <p className="text-xl text-muted-foreground font-body leading-relaxed max-w-3xl mx-auto">
            We're passionate about making wellness accessible, trusted, and
            delightful. Our platform connects you with the finest salons and
            spas, ensuring every treatment is a step towards a better you.
          </p>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {platformStats.map((stat, index) => (
              <div
                key={index}
                className="text-center transform transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-heading text-foreground mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground font-body">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-heading text-foreground mb-6">
                {story.title}
              </h2>
              <div className="space-y-4 text-muted-foreground font-body leading-relaxed">
                {story.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="relative">
              <Image
                src={story.image}
                alt="Wellness journey"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
                priority={false}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-muted-foreground font-body text-lg">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-card p-8 rounded-lg sophisticated-shadow text-center hover:scale-105 transition-transform"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-heading text-foreground mb-4">
                  {value.title}
                </h3>
                <p className="text-muted-foreground font-body">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground font-body text-lg">
              The passionate people behind BeautyBook
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="text-center group hover:scale-105 transition-transform"
              >
                <div className="relative mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={192}
                    height={192}
                    className="w-48 h-48 rounded-full mx-auto object-cover shadow-lg"
                    priority={false}
                  />
                </div>
                <h3 className="text-xl font-heading text-foreground mb-2">
                  {member.name}
                </h3>
                <p className="text-primary font-body mb-2">{member.role}</p>
                <p className="text-sm text-muted-foreground font-body">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-heading mb-6">{cta.title}</h2>
          <p className="text-xl font-body mb-8 opacity-90">{cta.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-3 rounded-lg font-heading"
              onClick={() => router.push(cta.primaryButtonLink as Route)}
            >
              {cta.primaryButtonText}
            </Button>
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-3 rounded-lg font-heading"
              onClick={() => router.push(cta.secondaryButtonLink as Route)}
            >
              {cta.secondaryButtonText}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
