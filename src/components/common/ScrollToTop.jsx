import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // or "smooth" if preferred, but "instant" is better for page changes
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
