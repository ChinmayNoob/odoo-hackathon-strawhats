"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Loader } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useCreateforum } from "@/lib/axios/forums";
import { useCurrentUser } from "@/lib/axios/users";

interface FormData {
    name: string;
    slug: string;
    description: string;
    picture: string;
}

interface FormErrors {
    name?: string;
    slug?: string;
    description?: string;
    picture?: string;
}

const CreateForumPage = () => {
    const router = useRouter();
    const { user: clerkUser, isLoaded } = useUser();
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
    const [errors, setErrors] = useState<FormErrors>({});
    const createForumMutation = useCreateforum();

    const [formData, setFormData] = useState<FormData>({
        name: "",
        slug: "",
        description: "",
        picture: "",
    });

    // Auto-generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = generateSlug(name);

        setFormData(prev => ({
            ...prev,
            name,
            slug
        }));

        // Clear name error if it exists
        if (errors.name) {
            setErrors(prev => ({ ...prev, name: undefined }));
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const slug = generateSlug(e.target.value);
        setFormData(prev => ({ ...prev, slug }));

        // Clear slug error if it exists
        if (errors.slug) {
            setErrors(prev => ({ ...prev, slug: undefined }));
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, description: e.target.value }));

        // Clear description error if it exists
        if (errors.description) {
            setErrors(prev => ({ ...prev, description: undefined }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, you'd upload to a service like Cloudinary or AWS S3
            // For now, we'll use a placeholder or you can implement your upload logic
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, picture: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, picture: "" }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Community name is required";
        } else if (formData.name.length < 3) {
            newErrors.name = "Community name must be at least 3 characters";
        } else if (formData.name.length > 50) {
            newErrors.name = "Community name must be less than 50 characters";
        }

        if (!formData.slug.trim()) {
            newErrors.slug = "URL slug is required";
        } else if (formData.slug.length < 3) {
            newErrors.slug = "URL slug must be at least 3 characters";
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = "URL slug can only contain lowercase letters, numbers, and hyphens";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        } else if (formData.description.length < 10) {
            newErrors.description = "Description must be at least 10 characters";
        } else if (formData.description.length > 500) {
            newErrors.description = "Description must be less than 500 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!clerkUser || !currentUser?.success || !currentUser.user) {
            toast.error("You must be logged in to create a community");
            return;
        }

        try {
            // Use the mutation to create the forum
            const result = await createForumMutation.mutateAsync({
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                description: formData.description.trim(),
                picture: formData.picture || "",
                creatorId: currentUser.user.id,
                path: "/forums",
            });

            if (result.success) {
                toast.success("Community created successfully!");
                router.push(`/forums/${result.forum?.id}`);
            } else {
                toast.error(result.error || "Failed to create community");
            }
        } catch (error) {
            console.error("Error creating forum:", error);
            toast.error("Failed to create community");
        }
    };

    if (!isLoaded || isLoadingUser) {
        return <div>Loading...</div>; // You might want to use a proper loading component here
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/forums">
                    <Button variant="ghost" className="mb-4 p-0 h-auto">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Communities
                    </Button>
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Create New Community
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Start a new programming community and connect with developers who share your interests
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Community Details</CardTitle>
                    <CardDescription>
                        Fill in the information below to create your community
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Community Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Community Name *</Label>
                            <Input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={handleNameChange}
                                placeholder="Enter community name"
                                className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        {/* URL Slug */}
                        <div className="space-y-2">
                            <Label htmlFor="slug">URL Slug *</Label>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-2">
                                    yoursite.com/forums/
                                </span>
                                <Input
                                    id="slug"
                                    type="text"
                                    value={formData.slug}
                                    onChange={handleSlugChange}
                                    placeholder="url-slug"
                                    className={errors.slug ? "border-red-500" : ""}
                                />
                            </div>
                            {errors.slug && (
                                <p className="text-sm text-red-500">{errors.slug}</p>
                            )}
                            <p className="text-sm text-gray-500">
                                This will be the URL for your community. Only lowercase letters, numbers, and hyphens are allowed.
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                placeholder="Describe what your community is about..."
                                rows={4}
                                className={errors.description ? "border-red-500" : ""}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description}</p>
                            )}
                            <p className="text-sm text-gray-500">
                                {formData.description.length}/500 characters
                            </p>
                        </div>

                        {/* Community Picture */}
                        <div className="space-y-2">
                            <Label htmlFor="picture">Community Picture</Label>
                            {formData.picture ? (
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                                    <Image
                                        src={formData.picture}
                                        alt="Community picture"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                    <label htmlFor="picture" className="cursor-pointer text-center">
                                        <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                                        <span className="text-xs text-gray-500">Upload</span>
                                    </label>
                                    <input
                                        id="picture"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            )}
                            <p className="text-sm text-gray-500">
                                Upload a picture for your community (optional)
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4 pt-6">
                            <Link href="/forums">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={createForumMutation.isPending}
                                className="bg-black dark:bg-white dark:text-black hover:bg-black/80 text-white"
                            >
                                {createForumMutation.isPending ? (
                                    <>
                                        <Loader size={16} className="animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Forum"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateForumPage;