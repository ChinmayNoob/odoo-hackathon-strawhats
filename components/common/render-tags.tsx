import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
    _id: string;
    name: string;
    totalQuestions?: number;
    showCount?: boolean;
    classname?: string;
}

const RenderTag = ({ _id, name, totalQuestions, showCount, classname }: Props) => {
    return (
        <Link href={`/tag/${_id}`} className="flex justify-between gap-2">
            <Badge className={`text-[#000000] dark:text-[#FFFFFF] text-nowrap rounded-md border border-[#cbcbcb] dark:border-[#1F1F22] bg-transparent p-1 text-xs uppercase hover:border-zinc-600 dark:hover:border-zinc-600 ${classname}`}>
                {name}
            </Badge>

            {showCount && (
                <p className="text-sm">{totalQuestions}</p>
            )}
        </Link>
    );
};

export default RenderTag;
