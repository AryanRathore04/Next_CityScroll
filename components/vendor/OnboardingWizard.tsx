"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Store,
  Image as ImageIcon,
  Briefcase,
  Users,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  Sparkles,
} from "lucide-react";
import { getErrorMessage } from "@/lib/client-error-helpers";

interface OnboardingWizardProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

interface ProfileFormData {
  businessName: string;
  businessType: string;
  customBusinessType: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  description: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
}

export function OnboardingWizard({
  userId,
  userEmail,
  onComplete,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Predefined business types
  const businessTypes = [
    "Salon",
    "Spa",
    "Wellness Center",
    "Beauty Studio",
    "Massage Parlor",
    "Hair Studio",
    "Nail Salon",
    "Barbershop",
    "Makeup Studio",
    "Skin Care Clinic",
    "Other",
  ];

  // Form data
  const [profileData, setProfileData] = useState<ProfileFormData>({
    businessName: "",
    businessType: "",
    customBusinessType: "",
    businessAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    description: "",
  });

  const [services, setServices] = useState<ServiceFormData[]>([]);
  const [currentService, setCurrentService] = useState<ServiceFormData>({
    name: "",
    description: "",
    category: "",
    duration: 30,
    price: 0,
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const steps = [
    {
      title: "Welcome!",
      subtitle: "Let's set up your business on CityScroll",
      icon: Sparkles,
    },
    {
      title: "Business Profile",
      subtitle: "Tell us about your business",
      icon: Store,
    },
    {
      title: "Add Services",
      subtitle: "What services do you offer?",
      icon: Briefcase,
    },
    {
      title: "Upload Images",
      subtitle: "Showcase your business",
      icon: ImageIcon,
    },
    {
      title: "All Set!",
      subtitle: "Your store is ready",
      icon: CheckCircle,
    },
  ];

  const handleProfileSubmit = async () => {
    try {
      setIsSubmitting(true);

      const updateData = {
        businessName: profileData.businessName,
        // Use custom business type if "Other" is selected, otherwise use the selected type
        businessType:
          profileData.businessType === "Other"
            ? profileData.customBusinessType
            : profileData.businessType,
        businessAddress: {
          street: profileData.businessAddress,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
        },
        phone: profileData.phone,
        description: profileData.description,
      };

      const response = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setCurrentStep(2);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Failed to update profile: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddService = () => {
    if (
      !currentService.name ||
      !currentService.category ||
      currentService.price <= 0
    ) {
      alert("Please fill in all service details");
      return;
    }

    setServices([...services, currentService]);
    setCurrentService({
      name: "",
      description: "",
      category: "",
      duration: 30,
      price: 0,
    });
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServicesSubmit = async () => {
    if (services.length === 0) {
      alert("Please add at least one service");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create all services
      for (const service of services) {
        const response = await fetch("/api/vendor/services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            ...service,
            vendorId: userId,
            active: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create service: ${service.name}`);
        }
      }

      setCurrentStep(3);
    } catch (error) {
      console.error("Error creating services:", error);
      alert(`Failed to create services: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploadingImages(true);

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      const response = await fetch("/api/vendor/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      const data = await response.json();
      setUploadedImages(data.images || []);

      event.target.value = "";
    } catch (error) {
      console.error("Error uploading images:", error);
      alert(`Failed to upload images: ${getErrorMessage(error)}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const response = await fetch("/api/vendor/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      const data = await response.json();
      setUploadedImages(data.images || []);
    } catch (error) {
      console.error("Error deleting image:", error);
      alert(`Failed to delete image: ${getErrorMessage(error)}`);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index < steps.length - 1 ? "flex-1" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    index <= currentStep
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      index < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <CurrentIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">{steps[currentStep].subtitle}</p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="text-center space-y-6 py-8">
                <p className="text-lg text-gray-700">
                  Welcome to CityScroll! We're excited to help you grow your
                  business.
                </p>
                <p className="text-gray-600">
                  This quick setup will help you create your store profile, add
                  services, and start accepting bookings in just a few minutes.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Store className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">
                      Set Up Profile
                    </p>
                    <p className="text-sm text-gray-600">
                      Add your business details
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <Briefcase className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Add Services</p>
                    <p className="text-sm text-gray-600">List what you offer</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <ImageIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Upload Photos</p>
                    <p className="text-sm text-gray-600">
                      Showcase your business
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Business Profile */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={profileData.businessName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          businessName: e.target.value,
                        })
                      }
                      placeholder="e.g., Serenity Spa"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select
                      value={profileData.businessType}
                      onValueChange={(value) => {
                        setProfileData({
                          ...profileData,
                          businessType: value,
                          // Clear custom input if switching away from "Other"
                          customBusinessType:
                            value !== "Other"
                              ? ""
                              : profileData.customBusinessType,
                        });
                      }}
                    >
                      <SelectTrigger id="businessType">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {profileData.businessType === "Other" && (
                    <div>
                      <Label htmlFor="customBusinessType">
                        Specify Business Type *
                      </Label>
                      <Input
                        id="customBusinessType"
                        placeholder="Enter your business type"
                        value={profileData.customBusinessType}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            customBusinessType: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="businessAddress">Street Address *</Label>
                  <Input
                    id="businessAddress"
                    value={profileData.businessAddress}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        businessAddress: e.target.value,
                      })
                    }
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          city: e.target.value,
                        })
                      }
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          state: e.target.value,
                        })
                      }
                      placeholder="Maharashtra"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={profileData.zipCode}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          zipCode: e.target.value,
                        })
                      }
                      placeholder="400001"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={profileData.description}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Tell customers about your business..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Add Services */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Added Services List */}
                {services.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Your Services ({services.length})
                    </h3>
                    <div className="space-y-2">
                      {services.map((service, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {service.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {service.category} • {service.duration} mins • ₹
                              {service.price}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveService(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Service Form */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Add a Service</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceName">Service Name *</Label>
                      <Input
                        id="serviceName"
                        value={currentService.name}
                        onChange={(e) =>
                          setCurrentService({
                            ...currentService,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Swedish Massage"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceCategory">Category *</Label>
                      <Input
                        id="serviceCategory"
                        value={currentService.category}
                        onChange={(e) =>
                          setCurrentService({
                            ...currentService,
                            category: e.target.value,
                          })
                        }
                        placeholder="e.g., Massage, Facial"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="serviceDescription">Description</Label>
                    <Textarea
                      id="serviceDescription"
                      value={currentService.description}
                      onChange={(e) =>
                        setCurrentService({
                          ...currentService,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your service..."
                      rows={2}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceDuration">
                        Duration (minutes) *
                      </Label>
                      <Input
                        id="serviceDuration"
                        type="number"
                        value={currentService.duration}
                        onChange={(e) =>
                          setCurrentService({
                            ...currentService,
                            duration: parseInt(e.target.value) || 30,
                          })
                        }
                        min="15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="servicePrice">Price (₹) *</Label>
                      <Input
                        id="servicePrice"
                        type="number"
                        value={currentService.price}
                        onChange={(e) =>
                          setCurrentService({
                            ...currentService,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        min="0"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddService}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Add This Service
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Images */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="wizard-image-upload"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    {uploadingImages ? "Uploading..." : "Upload Images"}
                  </label>
                  <input
                    id="wizard-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                  <span className="text-sm text-gray-600">
                    Upload photos of your business
                  </span>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={imageUrl}
                          alt={`Business ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(imageUrl)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">No images uploaded yet</p>
                    <p className="text-sm text-gray-500">
                      Upload images to showcase your business (optional)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <div className="text-center space-y-6 py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Congratulations! 🎉
                </h3>
                <p className="text-lg text-gray-700">
                  Your store is now live on CityScroll
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                  <p className="text-gray-700 mb-4">
                    You've successfully set up:
                  </p>
                  <div className="space-y-2 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Business Profile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>{services.length} Service(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>{uploadedImages.length} Image(s)</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">
                  You can now start accepting bookings and manage your business
                  from your dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || currentStep === 4 || isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep === 0 && (
                <Button onClick={() => setCurrentStep(1)}>
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 1 && (
                <Button
                  onClick={handleProfileSubmit}
                  disabled={
                    !profileData.businessName ||
                    !profileData.businessType ||
                    (profileData.businessType === "Other" &&
                      !profileData.customBusinessType) ||
                    !profileData.city ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  onClick={handleServicesSubmit}
                  disabled={services.length === 0 || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 3 && (
                <Button onClick={() => setCurrentStep(4)}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
