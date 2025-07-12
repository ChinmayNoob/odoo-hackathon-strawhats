"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FilterOption {
    name: string;
    value: string;
}

interface Props {
    filters: FilterOption[];
    otherClasses?: string;
    containerClasses?: string;
    placeholder?: string;
    value?: string;
    onValueChange: (value: string) => void;
}

const Filter = ({
    filters,
    otherClasses,
    containerClasses,
    placeholder = "Select a filter",
    value,
    onValueChange,
}: Props) => {
    return (
        <div className={`relative z-50 ${containerClasses}`}>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className={`${otherClasses} body-regular light-border background-light800_dark300 text-dark500_light700 border px-5 py-2.5`}>
                    <div className="line-clamp-1 flex-1 text-left">
                        <SelectValue placeholder={placeholder} />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {filters.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="cursor-pointer focus:bg-light-800 dark:focus:bg-dark-400"
                            >
                                {item.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
};

export default Filter; 