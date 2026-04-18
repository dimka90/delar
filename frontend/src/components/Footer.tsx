import React from 'react';
import logo from '../assets/DelarLogo2.jpeg';
import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center space-x-3">
              <img src={logo} className="h-10" alt="Delar Logo" />
            </div>
            <p className="text-gray-300 text-base">
              Revolutionizing land registry with blockchain technology for a more secure and transparent future.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300" aria-label="Facebook">
                <FiFacebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300" aria-label="Instagram">
                <FiInstagram size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300" aria-label="Twitter">
                <FiTwitter size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300" aria-label="LinkedIn">
                <FiLinkedin size={24} />
              </a>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Solutions</h3>
                <ul className="mt-4 space-y-4">
                  <FooterLink href="#" label="Land Registration" />
                  <FooterLink href="#" label="Property Transfer" />
                  <FooterLink href="#" label="Title Verification" />
                  <FooterLink href="#" label="Dispute Resolution" />
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
                <ul className="mt-4 space-y-4">
                  <FooterLink href="#" label="Help Center" />
                  <FooterLink href="#" label="Documentation" />
                  <FooterLink href="#" label="Guides" />
                  <FooterLink href="#" label="API Status" />
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
                <ul className="mt-4 space-y-4">
                  <FooterLink href="#" label="About Us" />
                  <FooterLink href="#" label="Blog" />
                  <FooterLink href="#" label="Careers" />
                  <FooterLink href="#" label="Press" />
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <FooterLink href="#" label="Privacy Policy" />
                  <FooterLink href="#" label="Terms of Service" />
                  <FooterLink href="#" label="Cookie Policy" />
                  <FooterLink href="#" label="GDPR" />
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {new Date().getFullYear()} Delar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const FooterLink: React.FC<{ href: string; label: string }> = ({ href, label }) => {
  return (
    <li>
      <a href={href} className="text-base text-gray-300 hover:text-white">
        {label}
      </a>
    </li>
  );
};

export default Footer;
