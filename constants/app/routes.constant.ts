export const ROUTES = {
  CART: "/cart",
  CHECKOUT: "/checkout",
} as const;

export const HIDE_CART_ROUTES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
] as const;