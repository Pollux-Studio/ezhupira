// TODO: replace with the real editions and prices.
export type Edition = {
  id: "hardcopy" | "ebook";
  name: string;
  description: string;
  price: number; // INR
  needsAddress: boolean;
};

export const editions: Edition[] = [
  {
    id: "hardcopy",
    name: "Hardcopy",
    description: "Printed book, shipped to your address on release day.",
    price: 0,
    needsAddress: true,
  },
  {
    id: "ebook",
    name: "E-book",
    description: "Digital edition, available to read on release day.",
    price: 0,
    needsAddress: false,
  },
];

export function formatPrice(price: number) {
  return price > 0 ? `₹${price}` : "Price TBA";
}
