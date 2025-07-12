"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ProfileSchema } from "@/lib/schema-types";
import { Check, Loader } from "lucide-react";
import { useUpdateUser } from "@/lib/axios/users";

interface ProfileProps {
    clerkId: string;
    user: string;
}

const Profile = ({ clerkId, user }: ProfileProps) => {
    const userInfo = JSON.parse(user);
    const router = useRouter();
    const pathname = usePathname();
    const { mutate: updateUserMutation, isPending } = useUpdateUser();

    // 1. Defining form.
    const form = useForm<z.infer<typeof ProfileSchema>>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            name: userInfo.user?.name || "",
            username: userInfo.user?.username || "",
            portfolioProfile: userInfo.user?.portfolioProfile || "",
            location: userInfo.user?.location || "",
            bio: userInfo.user?.bio || "",
        },
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof ProfileSchema>) {
        // Only include fields that have values (not empty strings)
        const updateData: Partial<{
            name: string;
            username: string;
            portfolioProfile?: string;
            location: string;
            bio: string;
        }> = {};

        if (values.name && values.name.trim() !== "") {
            updateData.name = values.name;
        }
        if (values.username && values.username.trim() !== "") {
            updateData.username = values.username;
        }
        if (values.bio && values.bio.trim() !== "") {
            updateData.bio = values.bio;
        }
        if (values.location && values.location.trim() !== "") {
            updateData.location = values.location;
        }
        if (values.portfolioProfile && values.portfolioProfile.trim() !== "") {
            updateData.portfolioProfile = values.portfolioProfile;
        }

        updateUserMutation(
            {
                clerkId,
                updateData,
                path: pathname,
            },
            {
                onSuccess: () => {
                    router.back();
                    toast.success("Profile updated", {
                        icon: <Check className="text-green-500" />,
                    });
                },
                onError: (error) => {
                    console.error(error);
                    toast.error("Failed to update profile");
                },
            }
        );
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-9 flex w-full flex-col gap-3"
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="space-y-3.5">
                            <FormLabel className="font-semibold">
                                Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter Name"
                                    className="font-normal min-h-[56px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem className="space-y-3.5">
                            <FormLabel className="font-semibold">
                                username
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Your Usename"
                                    className="font-normal min-h-[56px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="portfolioProfile"
                    render={({ field }) => (
                        <FormItem className="space-y-3.5">
                            <FormLabel className="font-semibold">
                                Leetcode Profile
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="url"
                                    placeholder="Your Leetcode Profile"
                                    className="font-normal min-h-[56px]"
                                    {...field}
                                    value={field.value || ""} // Convert null/undefined to empty string
                                />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem className="space-y-3.5">
                            <FormLabel className="font-semibold">
                                Location
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Where are you from?"
                                    className="font-normal min-h-[56px]"
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem className="space-y-3.5">
                            <FormLabel className="font-semibold">
                                Bio
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="What's special about you?"
                                    className="font-normal min-h-[56px]"
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <div className="mt-7 flex justify-end">
                    <Button
                        disabled={isPending}
                        type="submit"
                        className="w-fit"
                    >
                        {isPending ? (
                            <>
                                <Loader className="my-2 size-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
export default Profile;
