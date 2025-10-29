import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Databyte
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              About
            </Link>
            <Link to="/api-docs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              API Docs
            </Link>
            <Link to="/partners" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Partners
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Contact
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-medium transition-all duration-200">
                  Login
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 py-6 border-t border-gray-100 bg-white shadow-lg">
              <div className="container mx-auto px-6">
                <div className="flex flex-col space-y-6">
                  <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Home</Link>
                  <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">About</Link>
                  <Link to="/api-docs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">API Docs</Link>
                  <Link to="/partners" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Partners</Link>
                  <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Contact</Link>
                  <div className="flex flex-col space-y-3 pt-4">
                    <Link to="/auth/login">
                      <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth/register">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
