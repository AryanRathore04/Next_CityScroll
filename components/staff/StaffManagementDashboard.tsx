"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Staff {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  serviceIds: Array<{
    _id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  isActive: boolean;
  schedule: Record<
    string,
    {
      enabled: boolean;
      startTime: string;
      endTime: string;
      breakStart?: string;
      breakEnd?: string;
    }
  >;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  serviceIds: string[];
  schedule: Record<
    string,
    {
      enabled: boolean;
      startTime: string;
      endTime: string;
      breakStart?: string;
      breakEnd?: string;
    }
  >;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_SCHEDULE = {
  enabled: true,
  startTime: "09:00",
  endTime: "17:00",
  breakStart: "13:00",
  breakEnd: "14:00",
};

export function StaffManagementDashboard() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phone: "",
    position: "",
    serviceIds: [],
    schedule: Object.fromEntries(
      DAYS_OF_WEEK.map((day) => [day.key, { ...DEFAULT_SCHEDULE }]),
    ),
  });

  // Fetch staff and services
  useEffect(() => {
    Promise.all([fetchStaff(), fetchServices()]).finally(() =>
      setLoading(false),
    );
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch staff");

      const result = await response.json();
      if (result.success) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/vendor/services", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch services");

      const result = await response.json();
      if (result.success) {
        setServices(result.data);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: "",
      serviceIds: [],
      schedule: Object.fromEntries(
        DAYS_OF_WEEK.map((day) => [day.key, { ...DEFAULT_SCHEDULE }]),
      ),
    });
    setEditingStaff(null);
  };

  const openEditDialog = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      position: staffMember.position,
      serviceIds: staffMember.serviceIds.map((s) => s._id),
      schedule: staffMember.schedule,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingStaff
        ? `/api/staff/${editingStaff._id}`
        : "/api/staff";
      const method = editingStaff ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to ${editingStaff ? "update" : "create"} staff member`,
        );
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Staff member ${
            editingStaff ? "updated" : "created"
          } successfully`,
        });

        setIsDialogOpen(false);
        resetForm();
        fetchStaff(); // Refresh list
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${staffName}? This action can be undone by reactivating them later.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to deactivate staff member");
      }

      toast({
        title: "Staff Deactivated",
        description: "Staff member has been deactivated successfully",
      });

      fetchStaff(); // Refresh list
    } catch (error) {
      console.error("Error deactivating staff:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleScheduleChange = (
    day: string,
    field: string,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading staff...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h2>
          <p className="text-muted-foreground">
            Manage your team members and their schedules
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card key={member._id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>{member.position}</CardDescription>
                  </div>
                </div>
                <Badge variant={member.isActive ? "default" : "secondary"}>
                  {member.isActive ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Info */}
              {(member.email || member.phone) && (
                <div className="space-y-2">
                  {member.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {member.phone}
                    </div>
                  )}
                </div>
              )}

              {/* Services */}
              <div>
                <p className="text-sm font-medium mb-2">Assigned Services:</p>
                {member.serviceIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {member.serviceIds.slice(0, 2).map((service) => (
                      <Badge
                        key={service._id}
                        variant="outline"
                        className="text-xs"
                      >
                        {service.name}
                      </Badge>
                    ))}
                    {member.serviceIds.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.serviceIds.length - 2} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No services assigned
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(member)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(member._id, member.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {staff.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Staff Members Yet</h3>
                <p className="text-muted-foreground">
                  Add your first team member to get started with staff
                  management.
                </p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Staff Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "Update staff member information and schedule"
                : "Add a new team member with their schedule and service assignments"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                    placeholder="e.g., Hair Stylist, Nail Technician"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Service Assignments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Assignments</h3>
              <p className="text-sm text-muted-foreground">
                Select which services this staff member can perform
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {services.map((service) => (
                  <label
                    key={service._id}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            serviceIds: [...prev.serviceIds, service._id],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            serviceIds: prev.serviceIds.filter(
                              (id) => id !== service._id,
                            ),
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Weekly Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Set working hours for each day of the week
              </p>

              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center space-x-4 p-3 border rounded"
                  >
                    <div className="w-20">
                      <Switch
                        checked={formData.schedule[day.key]?.enabled || false}
                        onCheckedChange={(checked) =>
                          handleScheduleChange(day.key, "enabled", checked)
                        }
                      />
                      <Label className="text-sm font-medium">{day.label}</Label>
                    </div>

                    {formData.schedule[day.key]?.enabled && (
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          type="time"
                          value={
                            formData.schedule[day.key]?.startTime || "09:00"
                          }
                          onChange={(e) =>
                            handleScheduleChange(
                              day.key,
                              "startTime",
                              e.target.value,
                            )
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          to
                        </span>
                        <Input
                          type="time"
                          value={formData.schedule[day.key]?.endTime || "17:00"}
                          onChange={(e) =>
                            handleScheduleChange(
                              day.key,
                              "endTime",
                              e.target.value,
                            )
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          Break:
                        </span>
                        <Input
                          type="time"
                          value={
                            formData.schedule[day.key]?.breakStart || "13:00"
                          }
                          onChange={(e) =>
                            handleScheduleChange(
                              day.key,
                              "breakStart",
                              e.target.value,
                            )
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          to
                        </span>
                        <Input
                          type="time"
                          value={
                            formData.schedule[day.key]?.breakEnd || "14:00"
                          }
                          onChange={(e) =>
                            handleScheduleChange(
                              day.key,
                              "breakEnd",
                              e.target.value,
                            )
                          }
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingStaff ? "Update Staff" : "Add Staff"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
