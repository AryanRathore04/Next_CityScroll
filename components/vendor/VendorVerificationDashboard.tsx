"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building,
  Users,
  Star,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VerificationDocument {
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  expiryDate?: string;
  verified: boolean;
  verifiedAt?: string;
  rejectionReason?: string;
}

interface VendorVerification {
  _id: string;
  businessName: string;
  businessType: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "expired";
  documents: VerificationDocument[];
  requiredDocuments: string[];
  verificationScore: number;
  submittedAt?: string;
  verifiedAt?: string;
  expiryDate?: string;
  compliance: {
    healthAndSafety: boolean;
    insurance: boolean;
    licensing: boolean;
    taxation: boolean;
  };
  metrics: {
    totalBookings: number;
    successfulBookings: number;
    cancellationRate: number;
    averageRating: number;
  };
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

const STATUS_ICONS = {
  pending: Clock,
  under_review: Eye,
  approved: CheckCircle,
  rejected: XCircle,
  expired: AlertTriangle,
};

const DOCUMENT_TYPES = {
  business_license: "Business License",
  tax_certificate: "Tax Certificate",
  insurance_policy: "Insurance Policy",
  identity_proof: "Identity Proof",
  address_proof: "Address Proof",
  professional_certification: "Professional Certification",
  health_permit: "Health Permit",
  other: "Other Document",
};

export function VendorVerificationDashboard() {
  const [verification, setVerification] = useState<VendorVerification | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vendor/verification", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        setVerification(result.data.verification);
      } else if (response.status === 404) {
        // No verification exists yet
        setVerification(null);
      } else {
        throw new Error(result.error || "Failed to fetch verification");
      }
    } catch (error) {
      console.error("Error fetching verification:", error);
      toast({
        title: "Error",
        description: "Failed to load verification status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      setUploading(true);

      // In a real implementation, you would upload to a file storage service
      // For now, we'll simulate a file URL
      const fileUrl = `https://example.com/uploads/${file.name}`;

      const response = await fetch("/api/vendor/verification/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          documentType,
          fileName: file.name,
          fileUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchVerification();
        toast({
          title: "Success",
          description: result.message || "Document uploaded successfully",
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Error",
        description:
          error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const IconComponent =
      STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    return (
      STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getCompletionPercentage = () => {
    if (!verification) return 0;
    const verifiedDocs = verification.documents.filter(
      (doc) => doc.verified,
    ).length;
    return verification.requiredDocuments.length > 0
      ? Math.round((verifiedDocs / verification.requiredDocuments.length) * 100)
      : 0;
  };

  useEffect(() => {
    fetchVerification();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading verification status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Vendor Verification
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your business verification and compliance status
          </p>
        </div>

        {verification && (
          <Badge className={getStatusColor(verification.status)}>
            {getStatusIcon(verification.status)}
            <span className="ml-1 capitalize">
              {verification.status.replace("_", " ")}
            </span>
          </Badge>
        )}
      </div>

      {!verification ? (
        /* No Verification - Show Getting Started */
        <Card>
          <CardHeader>
            <CardTitle>Get Your Business Verified</CardTitle>
            <CardDescription>
              Complete your business verification to start accepting bookings
              and build trust with customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Increased Trust</h3>
                    <p className="text-sm text-muted-foreground">
                      Verified businesses get higher customer confidence
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium">More Bookings</h3>
                    <p className="text-sm text-muted-foreground">
                      Priority in search results and recommendations
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Access to Features</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock premium features and lower fees
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <Button className="w-full" size="lg">
                <Building className="h-4 w-4 mr-2" />
                Start Verification Process
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Existing Verification */
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{verification.businessName}</span>
                  <Badge className={getStatusColor(verification.status)}>
                    {getStatusIcon(verification.status)}
                    <span className="ml-1 capitalize">
                      {verification.status.replace("_", " ")}
                    </span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Business Type: {verification.businessType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Verification Progress</span>
                      <span>{getCompletionPercentage()}%</span>
                    </div>
                    <Progress
                      value={getCompletionPercentage()}
                      className="w-full"
                    />
                  </div>

                  {verification.status === "approved" &&
                    verification.verifiedAt && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Verification Approved</AlertTitle>
                        <AlertDescription>
                          Your business was verified on{" "}
                          {format(
                            new Date(verification.verifiedAt),
                            "MMMM d, yyyy",
                          )}
                          .
                          {verification.expiryDate && (
                            <>
                              {" "}
                              Expires on{" "}
                              {format(
                                new Date(verification.expiryDate),
                                "MMMM d, yyyy",
                              )}
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                  {verification.status === "rejected" && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Verification Rejected</AlertTitle>
                      <AlertDescription>
                        Please review the feedback and resubmit corrected
                        documents.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {verification.metrics.totalBookings}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Bookings
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {verification.metrics.averageRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Average Rating
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {verification.verificationScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Verification Score
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {verification.metrics.cancellationRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cancellation Rate
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Upload the following documents to complete your verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verification.requiredDocuments.map((docType) => {
                    const uploadedDoc = verification.documents.find(
                      (doc) => doc.type === docType,
                    );

                    return (
                      <div
                        key={docType}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {DOCUMENT_TYPES[
                                docType as keyof typeof DOCUMENT_TYPES
                              ] || docType}
                            </div>
                            {uploadedDoc && (
                              <div className="text-sm text-muted-foreground">
                                {uploadedDoc.fileName} • Uploaded{" "}
                                {format(
                                  new Date(uploadedDoc.uploadedAt),
                                  "MMM d, yyyy",
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {uploadedDoc ? (
                            <>
                              {uploadedDoc.verified ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : uploadedDoc.rejectionReason ? (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}

                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </>
                          ) : (
                            <div className="space-x-2">
                              <input
                                type="file"
                                id={`upload-${docType}`}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(docType, file);
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  document
                                    .getElementById(`upload-${docType}`)
                                    ?.click()
                                }
                                disabled={uploading}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>
                  Track your compliance across different regulatory areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(verification.compliance).map(
                    ([key, value]) => {
                      if (key === "lastUpdated") return null;

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {value ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>

                          <Badge variant={value ? "default" : "secondary"}>
                            {value ? "Compliant" : "Pending"}
                          </Badge>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Booking Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Bookings</span>
                      <span className="font-semibold">
                        {verification.metrics.totalBookings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful Bookings</span>
                      <span className="font-semibold">
                        {verification.metrics.successfulBookings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancellation Rate</span>
                      <span className="font-semibold">
                        {verification.metrics.cancellationRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Rating</span>
                      <span className="font-semibold">
                        {verification.metrics.averageRating.toFixed(1)}/5.0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification Score</span>
                      <span className="font-semibold">
                        {verification.verificationScore}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge className={getStatusColor(verification.status)}>
                        {verification.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
