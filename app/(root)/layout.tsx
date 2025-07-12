import LeftSideBar from "@/components/layouts/main-sidebar";
import Navbar from "@/components/layouts/navbar/navbar";
import RightSideBar from "@/components/layouts/right-sidebar";
import UserSync from "@/components/common/user-sync";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <main className="background-light850_dark100 relative mx-auto max-w-[86rem] font-spaceGrotesk">
            <UserSync />
            <Navbar />
            <div className="flex">
                <LeftSideBar />

                <section className="light-border flex min-h-screen  flex-1 flex-col border-r pb-6 pt-16 max-md:pb-14 ">
                    <div className="w-full max-w-3xl font-spaceGrotesk">{children}</div>
                </section>

                <RightSideBar />
            </div>
        </main>
    );
};

export default Layout;
