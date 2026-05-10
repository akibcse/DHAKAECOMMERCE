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
    const [lastAddedVariantKey, setLastAddedVariantKey] = useState(null);
    const [lastAddedVariations, setLastAddedVariations] = useState({});

    const addToCart = (product, selectedVariations = {}) => {
        setCart((prevCart) => {
            // For Fashion, we ALWAYS create a new row to allow individual size selection
            const isFashion = product.category === "Fashion";
            
            // Base key
            const baseKey = `${product.id}-${selectedVariations.size || 'N/A'}-${selectedVariations.color || 'N/A'}`;
            
            // If it's fashion, we append a unique ID to keep it separate
            const variantKey = isFashion 
                ? `${baseKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                : baseKey;

            // Non-fashion items still merge as normal
            if (!isFashion) {
                const existingItem = prevCart.find((item) => item.variantKey === variantKey);
                if (existingItem) {
                    return prevCart.map((item) =>
                        item.variantKey === variantKey
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }
            }

            // Otherwise add as a new row (Quantity is always 1 for individual fashion rows)
            return [...prevCart, { ...product, variantKey, selectedVariations, quantity: 1 }];
        });
        
        setLastAddedProduct(product);
        setLastAddedVariations(selectedVariations);

        // Re-calculate the key for the modal state
        const isFashion = product.category === "Fashion";
        const baseKey = `${product.id}-${selectedVariations.size || 'N/A'}-${selectedVariations.color || 'N/A'}`;
        
        setLastAddedVariantKey(isFashion ? null : baseKey); // For fashion, we'll handle it differently in the modal
        
        // Don't show the "Go to Cart" modal if we are already in the cart page
        if (window.location.pathname !== "/cart") {
            setIsCartModalOpen(true);
        }
    };

    const removeFromCart = (variantKey) => {
        setCart((prevCart) => prevCart.filter((item) => item.variantKey !== variantKey));
    };

    const updateQuantity = (variantKey, quantity) => {
        if (quantity < 1) return;
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.variantKey === variantKey ? { ...item, quantity } : item
            )
        );
    };

    const updateVariant = (oldVariantKey, newVariations) => {
        setCart((prevCart) => {
            const itemToUpdate = prevCart.find(i => i.variantKey === oldVariantKey);
            if (!itemToUpdate) return prevCart;

            const newVariantKey = `${itemToUpdate.id}-${newVariations.size || 'N/A'}-${newVariations.color || 'N/A'}`;
            
            // Check if this new variant already exists (excluding the current one)
            const existingSameVariant = prevCart.find(i => i.variantKey === newVariantKey && i.variantKey !== oldVariantKey);
            
            if (existingSameVariant) {
                // Merge quantities and remove the old one
                return prevCart.filter(i => i.variantKey !== oldVariantKey).map(i => 
                    i.variantKey === newVariantKey 
                        ? { ...i, quantity: i.quantity + itemToUpdate.quantity } 
                        : i
                );
            }

            // Just update the current item
            return prevCart.map(i => 
                i.variantKey === oldVariantKey 
                    ? { ...i, variantKey: newVariantKey, selectedVariations: newVariations } 
                    : i
            );
        });
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
                updateVariant,
                clearCart,
                cartSubtotal,
                productDiscountTotal,
                cartTotal,
                cartCount,
                isCartModalOpen,
                setIsCartModalOpen,
                lastAddedProduct,
                lastAddedVariantKey,
                lastAddedVariations,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
