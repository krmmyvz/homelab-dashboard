// --- src/theme/tokens/icons.js ---

/**
 * Standard icon sizes for consistent UI
 * Use with Lucide React icons: <Icon size={iconSizes.md} />
 */

export const iconSizes = {
    'icon-xs': 16,
    'icon-sm': 20,
    'icon-md': 24,
    'icon-lg': 32,
    'icon-xl': 48,
};

// Helper function to get icon size
export const getIconSize = (key) => iconSizes[key] || iconSizes['icon-md'];

// Export as default for easier imports
export default iconSizes;
