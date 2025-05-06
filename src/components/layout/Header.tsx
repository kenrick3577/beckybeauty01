import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Settings, Eye, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShopStore } from '../../store/shopStore';
import { getImageUrlWithCacheBusting } from '../../lib/supabase';

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const getCartItemsCount = useShopStore(state => state.getCartItemsCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Reset image error when profile changes
    if (profile?.profile_picture_url) {
      setImageError(false);
      setRefreshKey(Date.now());
      console.log("Header: Profile picture URL updated:", profile.profile_picture_url);
    }
  }, [profile?.profile_picture_url]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    closeMenu();
  };

  const isActive = (path: string) => {
    return location.pathname === path ? "text-primary-600" : "text-gray-700";
  };

  // Get profile image URL with cache busting
  const getProfileImageUrl = () => {
    if (!profile?.profile_picture_url || imageError) return null;
    
    try {
      return getImageUrlWithCacheBusting(profile.profile_picture_url);
    } catch (e) {
      console.error("Invalid URL:", profile.profile_picture_url);
      return profile.profile_picture_url;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 text-sm sm:text-base">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={closeMenu}>
              <Eye className="h-6 w-6 text-primary-600" />
              <span className="ml-2 text-lg font-bold text-primary-600 truncate max-w-[120px] sm:max-w-none">Becky Beauty</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`hover:text-primary-600 font-medium ${isActive('/')}`}>Home</Link>
            <Link to="/services" className={`hover:text-primary-600 font-medium ${isActive('/services')}`}>Services</Link>
            <Link to="/shop" className={`hover:text-primary-600 font-medium ${isActive('/shop')}`}>Shop</Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className={`hover:text-primary-600 font-medium flex items-center ${isActive('/admin')}`}
              >
                <Settings className="mr-1 h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Auth/Cart Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/appointments" 
                  className={`hover:text-primary-600 font-medium flex items-center ${isActive('/appointments')}`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  My Appointments
                </Link>
                <div className="relative group hidden sm:block">
                  <button className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                    <div className="h-8 w-8 rounded-full flex-shrink-0 bg-gray-100 overflow-hidden mr-2">
                      {profile?.profile_picture_url && !imageError ? (
                        <img
                          key={refreshKey}
                          src={getProfileImageUrl()}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error("Failed to load profile picture in header:", profile.profile_picture_url);
                            setImageError(true);
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <span className="mr-1">{profile?.name || profile?.email}</span>
                    {isAdmin && (
                      <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                        ADMIN
                      </span>
                    )}
                  </button>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>

                <Link to="/cart" className="relative p-1 rounded-full text-gray-700 hover:text-primary-600">
                  <ShoppingCart className="h-6 w-6" />
                  {getCartItemsCount() > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary-600 rounded-full">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  Log In
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-2 px-3 border-t border-gray-200 animate-slide-down">
          <nav className="flex flex-col">
            <Link to="/" className={`hover:text-primary-600 font-medium py-3 ${isActive('/')}`} onClick={closeMenu}>Home</Link>
            <Link to="/services" className={`hover:text-primary-600 font-medium py-3 ${isActive('/services')}`} onClick={closeMenu}>Services</Link>
            <Link to="/shop" className={`hover:text-primary-600 font-medium py-3 ${isActive('/shop')}`} onClick={closeMenu}>Shop</Link>
            {user ? (
              <>
                <Link to="/appointments" className={`hover:text-primary-600 font-medium py-3 ${isActive('/appointments')}`} onClick={closeMenu}>
                  <Calendar className="h-5 w-5 mr-2 inline" />
                  My Appointments
                </Link>
                <Link to="/profile" className="flex items-center text-gray-700 hover:text-primary-600 font-medium py-3" onClick={closeMenu}>
                  <div className="h-8 w-8 rounded-full flex-shrink-0 bg-gray-100 overflow-hidden mr-2">
                    {profile?.profile_picture_url && !imageError ? (
                      <img 
                        key={refreshKey}
                        src={getProfileImageUrl()}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={() => {
                          console.error("Failed to load profile picture in mobile header:", profile.profile_picture_url);
                          setImageError(true);
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <span className="truncate max-w-[180px]">{profile?.name || profile?.email}</span>
                  {isAdmin && (
                    <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                      ADMIN
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex items-center text-gray-700 hover:text-primary-600 font-medium py-3" 
                    onClick={closeMenu}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/cart" className="flex items-center text-gray-700 hover:text-primary-600 font-medium py-3" onClick={closeMenu}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart
                  {getCartItemsCount() > 0 && (
                    <span className="ml-2 bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full text-xs">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-700 hover:text-primary-600 font-medium py-3 w-full text-left"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-600 font-medium py-3"
                  onClick={closeMenu}
                >
                  Log In
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-primary-600 text-white px-4 py-3 rounded-md hover:bg-primary-700 transition-colors font-medium text-center mt-2"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}