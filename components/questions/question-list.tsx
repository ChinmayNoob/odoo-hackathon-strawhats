import React from 'react';
import { Card } from '@/components/ui/card';

interface QuestionsListProps {
    params: {
        page: number;
        pageSize: number;
    };
    clerkId: string | null;
    showFilter: boolean;
}

const QuestionsList = ({ params, clerkId, showFilter }: QuestionsListProps) => {
    // Dummy questions data
    const dummyQuestions = [
        {
            id: 1,
            title: "How to implement authentication in Next.js?",
            content: "I'm building a Next.js application and need help with authentication...",
            author: "John Doe",
            createdAt: "2024-03-20",
            votes: 42,
            answers: 5,
        },
        {
            id: 2,
            title: "Best practices for state management in React",
            content: "What are the current best practices for managing state in React applications?",
            author: "Jane Smith",
            createdAt: "2024-03-19",
            votes: 38,
            answers: 7,
        },
    ];

    return (
        <div className="mt-8 flex flex-col gap-4">
            {showFilter && (
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">Filter options will go here</p>
                </div>
            )}

            {dummyQuestions.map((question) => (
                <Card key={question.id} className="p-6">
                    <div className="flex justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">{question.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2">{question.content}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm">{question.votes} votes</p>
                            <p className="text-sm">{question.answers} answers</p>
                        </div>
                    </div>
                    <div className="flex justify-between mt-4">
                        <p className="text-sm text-muted-foreground">Posted by {question.author}</p>
                        <p className="text-sm text-muted-foreground">{question.createdAt}</p>
                    </div>
                </Card>
            ))}

            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                    Page {params.page} of {Math.ceil(100 / params.pageSize)}
                </p>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-muted"
                        disabled={params.page === 1}
                    >
                        Previous
                    </button>
                    <button
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-muted"
                        disabled={params.page * params.pageSize >= 100}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionsList;
