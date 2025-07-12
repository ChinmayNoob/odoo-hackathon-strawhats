import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  user: {
    id: number;
    clerkId: string;
    name: string;
    username: string;
    picture: string;
    bio?: string | null;
    location?: string | null;
    reputation?: number | null;
    totalQuestions: number;
    totalAnswers: number;
  };
}

const UserCard = ({ user }: Props) => {
  return (
    <Link href={`/profile/${user.clerkId}`} className="">
      <div className="background-light850_dark100 light-border-2 flex min-h-[260px] w-full flex-col items-center justify-center rounded-sm border hover:bg-zinc-200/10 dark:hover:bg-zinc-900/60">
        <div className="mb-3 size-[100px] overflow-hidden rounded-full">
          <Image
            src={user.picture || "/assets/icons/avatar.svg"}
            alt="user profile picture"
            className="size-full object-cover"
            width={100}
            height={100}
          />
        </div>
        <div className="mt-4 text-center">
          <h3 className="h3-bold text-dark200_light900 line-clamp-1">
            {user.name}
          </h3>
          <p className="body-regular text-variant">@{user.username}</p>
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2 text-sm text-dark400_light700">
              <span>{user.totalQuestions} Questions</span>
              <span>•</span>
              <span>{user.totalAnswers} Answers</span>
            </div>
            {user.reputation !== null && (
              <div className="text-sm text-dark400_light700">
                {user.reputation} Reputation
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default UserCard;
