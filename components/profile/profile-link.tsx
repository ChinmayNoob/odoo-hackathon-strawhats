import Image from 'next/image';
import Link from 'next/link';

interface ProfileLinkProps {
    imgUrl: string;
    title: string;
    href?: string;
}

const ProfileLink = ({ imgUrl, title, href }: ProfileLinkProps) => {
    return (
        <div className="flex items-center gap-2">
            <Image src={imgUrl} alt="icon" width={20} height={20} />
            {href ? (
                <Link
                    href={href}
                    target="_blank"
                    className="text-base font-medium text-[#FF7000] hover:underline"
                >
                    {title}
                </Link>
            ) : (
                <p className="text-base text-[#212734] dark:text-[#DCE3F1]">{title}</p>
            )}
        </div>
    );
};
export default ProfileLink;