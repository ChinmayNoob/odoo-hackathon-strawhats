"use client"

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-black w-full pb-8">
            <div className="w-full pt-4 text-center">
                <p className="text-white/70 text-sm font-poppins">
                    © {currentYear} StackIt. All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
