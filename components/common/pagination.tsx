"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    pageNumber: number;
    isNext: boolean;
    onPageChange: (page: number) => void;
}

const Pagination = ({ pageNumber, isNext, onPageChange }: Props) => {
    const handlePrevious = () => {
        if (pageNumber > 1) {
            onPageChange(pageNumber - 1);
        }
    };

    const handleNext = () => {
        if (isNext) {
            onPageChange(pageNumber + 1);
        }
    };

    if (pageNumber === 1 && !isNext) return null;

    return (
        <div className="flex w-full items-center justify-center gap-2">
            <Button
                disabled={pageNumber <= 1}
                onClick={handlePrevious}
                className="light-border-2 btn flex min-h-[36px] items-center justify-center gap-2 border"
                variant="outline"
            >
                <ChevronLeft size={16} />
                <p className="body-medium text-dark200_light800">Prev</p>
            </Button>

            <div className="bg-primary-500 flex items-center justify-center rounded-md px-3.5 py-2">
                <p className="body-semibold text-light-900">{pageNumber}</p>
            </div>

            <Button
                disabled={!isNext}
                onClick={handleNext}
                className="light-border-2 btn flex min-h-[36px] items-center justify-center gap-2 border"
                variant="outline"
            >
                <p className="body-medium text-dark200_light800">Next</p>
                <ChevronRight size={16} />
            </Button>
        </div>
    );
};

export default Pagination; 