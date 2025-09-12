"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageLoading } from "@/components/ui/loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, ArrowLeft, CreditCard, Calendar, Lock, CheckCircle, Crown, Star, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

export default function PaymentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "", billingAddress: "", city: "", zipCode: "", country: "" });
  const router = useRouter();

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const planId = (params.get("plan") || "premium") as "basic" | "premium" | "vip";
  const billingCycle = (params.get("billing") || "monthly") as "monthly" | "yearly";

  const planDetails = {
    basic: { name: "Essential", monthlyPrice: 999, yearlyPrice: 9990, features: ["1 Complimentary Treatment per month","10% Discount on all services","Priority booking"], icon: <Gift className="h-6 w-6" />, color: "text-amber-600" },
    premium: { name: "Premium", monthlyPrice: 2499, yearlyPrice: 24990, features: ["2 Complimentary Treatments per month","20% Discount on all services","Free partner guest sessions","Exclusive workshop access"], icon: <Star className="h-6 w-6" />, color: "text-blue-600" },
    vip: { name: "VIP", monthlyPrice: 4999, yearlyPrice: 49990, features: ["4 Complimentary Treatments per month","30% Discount on all services","Unlimited guest sessions","Personal wellness consultant","Exclusive events access"], icon: <Crown className="h-6 w-6" />, color: "text-purple-600" },
  } as const;

  const selectedPlan = planDetails[planId];
  const isYearly = billingCycle === "yearly";
  const price = isYearly ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  const savings = isYearly ? selectedPlan.monthlyPrice * 12 - selectedPlan.yearlyPrice : 0;

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      router.push("/membership?success=true" as Route);
    }, 1500);
  };

  const formatCardNumber = (value: string) => value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim().substring(0, 19);
  const formatExpiryDate = (value: string) => value.replace(/\D/g, "").replace(/(\d{2})(\d{1,2})/, "$1/$2").substring(0, 5);

  if (isLoading) return <PageLoading />;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/" as Route)}>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading text-foreground tracking-wide">BeautyBook</span>
            </div>
            <Button variant="ghost" onClick={() => router.push("/membership" as Route)} className="flex items-center gap-2 font-body text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Membership
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg p-6 sophisticated-shadow border border-border h-fit">
            <h2 className="text-2xl font-heading text-foreground mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className={`${selectedPlan.color}`}>{selectedPlan.icon}</div>
                <div className="flex-1">
                  <h3 className="font-heading text-foreground">{selectedPlan.name} Plan</h3>
                  <p className="text-sm text-muted-foreground font-body">{isYearly ? "Yearly" : "Monthly"} subscription</p>
                </div>
              </div>
              <div className="space-y-2">
                {selectedPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground font-body">{feature}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between"><span className="font-body text-muted-foreground">Subtotal</span><span className="font-body text-foreground">₹{price}</span></div>
                {isYearly && savings > 0 && (
                  <div className="flex justify-between text-emerald-600"><span className="font-body">Yearly Savings</span><span className="font-body">-₹{savings}</span></div>
                )}
                <div className="flex justify-between"><span className="font-body text-muted-foreground">Tax</span><span className="font-body text-foreground">₹{Math.round(price * 0.18)}</span></div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg"><span className="font-heading text-foreground">Total</span><span className="font-heading text-foreground">₹{price + Math.round(price * 0.18)}</span></div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 sophisticated-shadow border border-border">
            <h2 className="text-2xl font-heading text-foreground mb-6">Payment Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-heading text-foreground">Card Information</h3>
                <div>
                  <Label className="text-sm font-body text-foreground">Card Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })} placeholder="1234 5678 9012 3456" className="pl-10 h-12 font-body" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-body text-foreground">Expiry Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: formatExpiryDate(e.target.value) })} placeholder="MM/YY" className="pl-10 h-12 font-body" required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-body text-foreground">CVV</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={formData.cvv} onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, "").substring(0, 4) })} placeholder="123" className="pl-10 h-12 font-body" type="password" required />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-body text-foreground">Cardholder Name</Label>
                  <Input value={formData.cardholderName} onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })} placeholder="Name as on card" className="h-12 font-body" required />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-heading text-foreground">Billing Address</h3>
                <div>
                  <Label className="text-sm font-body text-foreground">Address</Label>
                  <Input value={formData.billingAddress} onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })} placeholder="123 Main St" className="h-12 font-body" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-body text-foreground">City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Mumbai" className="h-12 font-body" required />
                  </div>
                  <div>
                    <Label className="text-sm font-body text-foreground">ZIP Code</Label>
                    <Input value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, "").substring(0, 6) })} placeholder="400001" className="h-12 font-body" required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-body text-foreground">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger className="h-12 font-body"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-cta hover:bg-cta/90 text-cta-foreground h-12 font-heading" disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-cta-foreground border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </div>
                ) : (
                  `Pay ₹${price + Math.round(price * 0.18)}`
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="font-body">Your payment information is secure and encrypted</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
