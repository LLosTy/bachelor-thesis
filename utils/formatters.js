export const formatters = {
  formatPrice: (price) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(price);
  },

  formatMileage: (mileage) => {
    return new Intl.NumberFormat("cs-CZ").format(mileage) + " km";
  },
};
