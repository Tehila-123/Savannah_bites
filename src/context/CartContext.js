import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState({
    name: 'Guest User',
    email: 'guest@savannabites.com',
    phone: '+234 800 000 0000',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  });
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const addToCart = useCallback((product, quantity = 1, options = {}) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.id === product.id && item.spice === options.spice
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, { ...product, quantity, spice: options.spice || 'Medium' }];
    });
    showToast(`Added ${product.name} to cart!`);
  }, [showToast]);

  const updateQuantity = useCallback((index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: updated[index].quantity + delta };
      if (updated[index].quantity <= 0) updated.splice(index, 1);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        user,
        setUser,
        orderPlaced,
        setOrderPlaced,
        toast,
        showToast,
        addToCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
