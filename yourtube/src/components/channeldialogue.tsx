import { useRouter } from "next/router";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const Channeldialogue = ({ isopen, onclose, channeldata, mode }: any) => {
  const { user, setUser } = useUser();
  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    city: "",
    image: "",
  });
  const [isSubmitting, setisSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (channeldata && mode === "edit") {
      setFormData({
        name: channeldata.name || "",
        description: channeldata.description || "",
        city: user?.city || "",
        image: channeldata.image || "",
      });
      setImagePreview(channeldata.image || null);
    } else {
      setFormData({
        name: user?.name || "",
        description: "",
        city: user?.city || "",
        image: user?.image || "",
      });
      setImagePreview(user?.image || null);
    }
  }, [channeldata, user, mode]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData((prev) => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlesubmit = async (e: FormEvent) => {
    e.preventDefault();
    setisSubmitting(true);
    try {
      const payload = {
        channelname: formData.name,
        description: formData.description,
        city: formData.city,
        image: formData.image,
      };
      const userId = user?._id || user?.id;
      if (!userId) {
        console.error("Cannot update channel: User ID is missing", user);
        alert("Error: User session is invalid. Please log in again.");
        setisSubmitting(false);
        return;
      }
      const response = await axiosInstance.patch(
        `/user/update/${userId}`,
        payload
      );
      setUser(response?.data);
      router.push(`/channel/${user?._id}`);
      setFormData({
        name: "",
        description: "",
        city: "",
        image: "",
      });
      setImagePreview(null);
      onclose();
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setisSubmitting(false);
    }
  };
  return (
    <Dialog open={isopen} onOpenChange={onclose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create your channel" : "Edit your channel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handlesubmit} className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xl font-bold">
                  {formData.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="image" className="cursor-pointer text-sm text-blue-500 hover:underline">
                Change Profile Photo
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City (Location)</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. Kolhapur"
            />
          </div>
          {/* Channel Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Channel Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Tell viewers about your channel..."
            />
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={onclose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Create Channel"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Channeldialogue;
