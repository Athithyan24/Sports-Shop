export const defaultCategories = [
  {
    mainCategory: "Apparel",
    games: ["Cricket", "Football", "General"],
    productTypes: [
      {
        typeName: "Jersey",
        requiredFields: ["Fabric", "Fit Type"],
        variantFields: ["Size", "Color"], // Fields that generate separate SKUs/Stock
        options: {
          Size: ["XS", "S", "M", "L", "XL", "XXL"],
          Color: ["Red", "Blue", "White", "Black", "Yellow"]
        }
      },
      {
        typeName: "Track Pants",
        requiredFields: ["Material", "Pockets"],
        variantFields: ["Waist Size", "Color"],
        options: {
          "Waist Size": ["28", "30", "32", "34", "36"],
          Color: ["Black", "Navy", "Grey"]
        }
      }
    ]
  },
  {
    mainCategory: "Footwear",
    games: ["Cricket", "Football", "Running"],
    productTypes: [
      {
        typeName: "Spikes",
        requiredFields: ["Sole Type", "Ankle Height"],
        variantFields: ["Shoe Size", "Width"],
        options: {
          "Shoe Size": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
          Width: ["Standard", "Wide"]
        }
      }
    ]
  },
  {
    mainCategory: "Sports Equipment",
    games: ["Cricket", "Tennis"],
    productTypes: [
      {
        typeName: "Cricket Bat",
        requiredFields: ["Willow Type", "Weight Range", "Sweet Spot"],
        variantFields: ["Size"],
        options: {
          Size: ["Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6", "Harrow", "SH", "LH"],
          "Willow Type": ["English Willow", "Kashmir Willow"],
          "Weight Range": ["1100g - 1150g", "1150g - 1200g", "1200g+"]
        }
      }
    ]
  }
];