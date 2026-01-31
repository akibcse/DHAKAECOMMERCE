import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [lastAddedProduct, setLastAddedProduct] = useState(null);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        setLastAddedProduct(product);
        setIsCartModalOpen(true);
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return;
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartSubtotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const productDiscountTotal = cart.reduce(
        (total, item) => total + (item.discountPrice ? (item.price - item.discountPrice) * item.quantity : 0),
        0
    );

    const cartTotal = cartSubtotal - productDiscountTotal;

    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartSubtotal,
                productDiscountTotal,
                cartTotal,
                cartCount,
                isCartModalOpen,
                setIsCartModalOpen,
                lastAddedProduct,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
