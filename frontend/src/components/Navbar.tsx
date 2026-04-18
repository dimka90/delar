import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/delar-logo-white.png";
import { HiMenu, HiX } from "react-icons/hi";
import { ToastContainer } from "react-toastify";
import { useAppKitAccount } from "@reown/appkit/react";
import "react-toastify/dist/ReactToastify.css";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { address } = useAppKitAccount();
  const isConnected = Boolean(address);
  const navigate = useNavigate();

  // Redirect to home on disconnect
  useEffect(() => {
    if (!isConnected) {
      navigate("/");
    }
  }, [isConnected, navigate]);

  const routesWithoutNavbar = [
    '/dashboard',
    '/lands/user',
    '/lands/all',
    '/register',
    '/listings'
  ];

  const hideNavbar = routesWithoutNavbar.includes(location.pathname);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const navItems = [
    { href: "/", label: "Discovery" },
    { href: "/listings", label: "Marketplace" },
    ...(isConnected ? [
      { href: "/lands/all", label: "All Properties" },
      { href: "/register", label: "Register Land" },
      { href: "/dashboard", label: "Dashboard" },
    ] : []),
  ];

  const shellClass = hideNavbar
    ? "rounded-[1.25rem] border border-[rgba(180,140,90,0.08)] bg-[#111827]/88 px-4 shadow-md"
    : "rounded-2xl border border-white/10 bg-black/20 px-4 shadow-lg backdrop-blur-xl";

  return (
    <nav className={hideNavbar ? "mb-6 lg:mb-8" : ""}>
      <div className={shellClass}>
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" onClick={handleLinkClick}>
                <img
                  src={logo}
                  alt="logo"
                  className="h-10 w-auto object-contain"
                />
              </Link>
            </div>
          </div>
          {!hideNavbar && (
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={location.pathname === item.href}
                />
              ))}
            </div>
          )}
          <div className="hidden sm:flex sm:items-center">
            <w3m-button balance="hide" size="sm" />
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <HiX className="block h-6 w-6" /> : <HiMenu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && !hideNavbar && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-gray-950/95 sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                onClick={handleLinkClick}
              />
            ))}
          </div>
          <div className="border-t border-white/[0.05] px-4 py-4">
            <w3m-button balance="hide" size="md" />
          </div>
        </div>
      )}
      <div className="absolute">
        <ToastContainer />
      </div>
    </nav>
  );
};

interface NavLinkProps {
  href: string;
  label: string;
  active?: boolean;
}

const NavLink = ({
  href,
  label,
  active = false
}: NavLinkProps) => {
  return (
    <Link
      to={href}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${active
        ? "border-primary text-white"
        : "border-transparent text-gray-400 hover:border-[#C4A484] hover:text-gray-100"
        }`}
    >
      {label}
    </Link>
  );
};

// Component for mobile navigation links
interface MobileNavLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
}

const MobileNavLink = ({
  href,
  label,
  onClick
}: MobileNavLinkProps) => {
  return (
    <Link
      to={href}
      className="block px-4 py-2 text-left text-gray-300"
      onClick={onClick}
    >
      {label}
    </Link>
  );
};

export default Navbar;
