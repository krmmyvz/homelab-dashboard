// --- src/theme/tokens/zIndex.js ---

/**
 * Z-Index hierarchy for consistent layering
 * ==========================================
 * BASIT VE NET KATMAN SİSTEMİ - Manuel değer kullanma!
 * 
 * Layer 0 (0-99): Base content
 * Layer 1 (100-199): Sticky/Fixed elements
 * Layer 2 (200-299): Sidebar & Navigation
 * Layer 3 (300-399): Dropdowns & Tooltips
 * Layer 4 (400-499): Modals & Dialogs
 * Layer 5 (500-999): Edit/DnD Overlays
 * Layer 6 (1000+): Full-screen overlays (Settings)
 * Layer 7 (2000+): Toast notifications
 */

export const zIndex = {
    // Layer 0: Base content (0-99)
    'z-background': -1,
    'z-base': 0,
    'z-content': 1,
    
    // Layer 1: Sticky/Fixed elements (100-199)
    'z-sticky': 100,
    'z-fixed': 100,
    
    // Layer 2: Sidebar & Navigation (200-299)
    'z-sidebar': 200,
    'z-header': 200,
    
    // Layer 3: Dropdowns & Tooltips (300-399)
    'z-dropdown': 300,
    'z-popover': 300,
    'z-tooltip': 300,
    'z-select': 300,
    'z-color-picker': 300,
    
    // Layer 4: Modals & Dialogs (400-499)
    'z-modal-backdrop': 400,
    'z-modal': 401,
    
    // Layer 5: Edit/DnD Overlays (500-999)
    'z-edit-overlay': 500,
    'z-dnd-overlay': 500,
    
    // Layer 6: Full-screen overlays - Settings (1000-1999)
    'z-sheet-backdrop': 1000,
    'z-sheet': 1001,
    'z-sheet-dropdown': 1002,  // Dropdowns inside sheet
    
    // Layer 7: Toast notifications - Always on top (2000+)
    'z-toast': 2000,
    'z-notification': 2000,
};

// Helper function to get z-index value
export const getZIndex = (key) => zIndex[key] || 0;
