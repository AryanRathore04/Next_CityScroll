"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Clock, Calendar, CreditCard, Check, Leaf, ArrowRight, User, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

const services = [
  { id: "1", name: "Deep Tissue Massage", duration: "60 mins", price: 2500, description: "Intensive therapeutic massage targeting muscle tension" },
  { id: "2", name: "Hot Stone Therapy", duration: "75 mins", price: 3200, description: "Relaxing treatment using heated stones" },
  { id: "3", name: "Aromatherapy Session", duration: "45 mins", price: 2000, description: "Holistic therapy using essential oils" },
];

const timeSlots = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

const steps = [
  { id: 1, title: "Service Selection" },
  { id: 2, title: "Date & Time" },
  { id: 3, title: "Payment" },
];

export default function BookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerInfo, setCustomerInfo] = useState({ firstName: "", lastName: "", email: "", phone: "", specialRequests: "" });

  const selectedServiceData = services.find((s) => s.id === selectedService);
  const bookingFee = 50;
  const subtotal = selectedServiceData ? selectedServiceData.price + bookingFee : 0;

  const nextStep = () => { if (currentStep < 3) setCurrentStep((s) => s + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep((s) => s - 1); else router.back(); };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="bg-white/95 backdrop-blur-sm border-b border-spa-stone/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="p-2" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/" as Route)}>
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-light text-spa-charcoal tracking-wide">BeautyBook</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${currentStep >= step.id ? "bg-primary border-primary text-white" : "border-spa-stone text-spa-charcoal/60"}`}>
                {currentStep > step.id ? <Check className="h-5 w-5" /> : <span className="text-sm">{step.id}</span>}
              </div>
              <span className={`ml-3 text-sm font-light ${currentStep >= step.id ? "text-spa-charcoal" : "text-spa-charcoal/60"}`}>{step.title}</span>
              {index < steps.length - 1 && (
                <div className={`h-px w-16 mx-6 ${currentStep > step.id ? "bg-primary" : "bg-spa-stone"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg sophisticated-shadow border border-spa-stone/10 p-8">
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-light text-spa-charcoal mb-6">Choose Your Treatment</h2>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className={`border rounded-lg p-6 cursor-pointer transition-all ${selectedService === service.id ? "border-primary bg-primary/5" : "border-spa-stone/20 hover:border-spa-stone/40"}`} onClick={() => setSelectedService(service.id)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-spa-charcoal mb-2">{service.name}</h3>
                            <p className="text-spa-charcoal/60 font-light text-sm mb-3">{service.description}</p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-spa-charcoal/60">
                                <Clock className="h-4 w-4" />
                                <span className="font-light text-sm">{service.duration}</span>
                              </div>
                              <div className="text-lg font-medium text-primary">₹{service.price.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedService === service.id ? "border-primary bg-primary" : "border-spa-stone"}`}>
                            {selectedService === service.id && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-light text-spa-charcoal mb-6">Select Date & Time</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Preferred Date</Label>
                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-spa-stone/20 rounded-lg font-light" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Service Duration</Label>
                        <Select>
                          <SelectTrigger className="border-spa-stone/20 rounded-lg font-light">
                            <SelectValue placeholder={selectedServiceData?.duration || "Select duration"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">{selectedServiceData?.duration || "60 mins"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Available Time Slots</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {timeSlots.map((time) => (
                          <Button key={time} variant={selectedTime === time ? "default" : "outline"} size="sm" onClick={() => setSelectedTime(time)} className={`font-light ${selectedTime === time ? "bg-primary text-white" : "border-spa-stone/30 text-spa-charcoal"}`}>
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">First Name*</Label>
                        <Input value={customerInfo.firstName} onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })} className="border-spa-stone/20 rounded-lg font-light" placeholder="Enter your first name" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Last Name*</Label>
                        <Input value={customerInfo.lastName} onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })} className="border-spa-stone/20 rounded-lg font-light" placeholder="Enter your last name" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Email Address*</Label>
                        <Input type="email" value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} className="border-spa-stone/20 rounded-lg font-light" placeholder="your@email.com" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Phone Number*</Label>
                        <Input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} className="border-spa-stone/20 rounded-lg font-light" placeholder="+91 98765 43210" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Special Requests (Optional)</Label>
                      <textarea value={customerInfo.specialRequests} onChange={(e) => setCustomerInfo({ ...customerInfo, specialRequests: e.target.value })} className="w-full border border-spa-stone/20 rounded-lg p-3 font-light text-sm resize-none" rows={3} placeholder="Any special requirements or preferences..." />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-light text-spa-charcoal mb-6">Payment Method</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-primary rounded-lg p-4 bg-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-primary" />
                          <span className="font-medium text-spa-charcoal">Credit/Debit Card</span>
                        </div>
                      </div>
                      <div className="border border-spa-stone/30 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border border-spa-stone/50" />
                          <span className="font-light text-spa-charcoal/60">UPI Payment</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Card Number</Label>
                        <Input placeholder="1234 5678 9012 3456" className="border-spa-stone/20 rounded-lg font-light" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Expiry Date</Label>
                          <Input placeholder="MM/YY" className="border-spa-stone/20 rounded-lg font-light" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-spa-charcoal mb-3 block">CVV</Label>
                          <Input placeholder="123" className="border-spa-stone/20 rounded-lg font-light" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-spa-charcoal mb-3 block">Cardholder Name</Label>
                        <Input placeholder="Name as on card" className="border-spa-stone/20 rounded-lg font-light" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-spa-stone/20">
                <Button variant="outline" onClick={prevStep} className="border-spa-stone/30 text-spa-charcoal font-light">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {currentStep === 1 ? "Back" : "Previous"}
                </Button>
                <Button onClick={nextStep} disabled={(currentStep === 1 && !selectedService) || (currentStep === 2 && (!selectedDate || !selectedTime)) || currentStep === 3} className="bg-primary text-white hover:bg-spa-sage font-medium">
                  {currentStep === 3 ? "Complete Payment" : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sophisticated-shadow border border-spa-stone/10 p-6 h-fit sticky top-24">
            <h3 className="font-medium text-spa-charcoal mb-4">Booking Summary</h3>
            {selectedServiceData && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-spa-stone/20">
                  <div className="font-medium text-spa-charcoal mb-1">{selectedServiceData.name}</div>
                  <div className="text-sm text-spa-charcoal/60 font-light">{selectedServiceData.duration}</div>
                </div>
                {selectedDate && selectedTime && (
                  <div className="pb-4 border-b border-spa-stone/20">
                    <div className="flex items-center gap-2 text-sm text-spa-charcoal/80">
                      <Calendar className="h-4 w-4" />
                      <span className="font-light">{selectedDate} at {selectedTime}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-spa-charcoal/80 font-light">Service</span>
                    <span className="font-medium">₹{selectedServiceData.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-spa-charcoal/80 font-light">Booking Fee</span>
                    <span className="font-medium">₹{bookingFee}</span>
                  </div>
                  <div className="flex justify-between text-lg font-medium pt-2 border-t border-spa-stone/20">
                    <span>Total</span>
                    <span className="text-primary">₹{subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-spa-cream rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-spa-charcoal/60 mt-0.5" />
                <div>
                  <div className="font-medium text-spa-charcoal text-sm">Serenity Wellness Spa</div>
                  <div className="text-sm text-spa-charcoal/60 font-light">Connaught Place, New Delhi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
