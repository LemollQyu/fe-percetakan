import Footer from "@/components/Footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <div className="min-h-[100vh] flex flex-col items-center justify-center px-4 pb-6 pt-3 bg-[#f5f0eb]">
        <h1 className="text-5xl md:text-6xl text-center mb-4 font-normal">
          404 Page Not Found
        </h1>
        <p className="text-sm md:text-base text-center text-gray-700 mb-8">
          The page you requested does not exist.
        </p>
        <Link
          href="/"
          style={{ background: "#2C1810" }}
          className=" text-white text-sm font-semibold px-8 py-3 tracking-wide"
        >
          Home
        </Link>
      </div>
      <Footer isMobileView={false} />
    </>
  );
}
