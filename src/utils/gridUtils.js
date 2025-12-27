// --- src/utils/gridUtils.js ---

/**
 * Grid layout utility functions for dashboard card management
 * Handles collision detection, auto-placement, and grid compacting
 */

// Constants
const DEFAULT_ITEM_SIZE = { w: 3, h: 2 };
const MAX_SEARCH_ROWS = 100; // Prevent infinite loops
const MIN_COLS = 1;
// Increase minimum item size so cards are not tiny by default
const MIN_ITEM_SIZE = { w: 2, h: 2 };

// Expose row/col layout constants so UI can share the same sizing math
export const ROW_HEIGHT = 120; // px (should match DashboardGrid.module.css grid-auto-rows)
export const GRID_GAP = 16; // px
export { MIN_ITEM_SIZE, DEFAULT_ITEM_SIZE };

/**
 * Validates grid item structure
 * @param {Object} item - Grid item to validate
 * @returns {boolean}
 */
export const isValidGridItem = (item) => {
  return item && 
    typeof item.x === 'number' && item.x >= 0 &&
    typeof item.y === 'number' && item.y >= 0 &&
    typeof item.w === 'number' && item.w >= 1 &&
    typeof item.h === 'number' && item.h >= 1;
};

/**
 * Validates layout array
 * @param {Array} layout - Layout array to validate
 * @returns {boolean}
 */
export const isValidLayout = (layout) => {
  return Array.isArray(layout) && layout.every(isValidGridItem);
};

/**
 * Sanitizes and validates input parameters
 * @param {Array} layout - Layout array
 * @param {Object} item - Grid item
 * @param {number} cols - Column count
 * @returns {Object} - Sanitized parameters
 */
export const sanitizeParams = (layout = [], item = {}, cols = 12) => {
  return {
    layout: isValidLayout(layout) ? layout : [],
    item: isValidGridItem(item) ? item : { ...DEFAULT_ITEM_SIZE, x: 0, y: 0 },
    cols: Math.max(cols, MIN_COLS)
  };
};

/**
 * Checks if two grid items collide using AABB (Axis-Aligned Bounding Box) algorithm
 * @param {Object} item1 - First grid item {x, y, w, h}
 * @param {Object} item2 - Second grid item {x, y, w, h}
 * @returns {boolean}
 */
export const isColliding = (item1, item2) => {
  // Same item reference check
  if (item1 === item2) return false;
  
  // Validate items
  if (!isValidGridItem(item1) || !isValidGridItem(item2)) return false;
  
  // AABB collision detection
  return (
    item1.x < item2.x + item2.w &&
    item1.x + item1.w > item2.x &&
    item1.y < item2.y + item2.h &&
    item1.y + item1.h > item2.y
  );
};

/**
 * Checks if an item collides with any item in the layout
 * @param {Array} layout - Array of grid items
 * @param {Object} item - Item to check collision for
 * @param {string} excludeId - Optional ID to exclude from collision check (for self-exclusion)
 * @returns {boolean}
 */
export const hasCollision = (layout, item, excludeId = null) => {
  const { layout: validLayout, item: validItem } = sanitizeParams(layout, item);
  
  return validLayout.some(otherItem => {
    // Skip self-collision if excludeId matches
    if (excludeId && otherItem.i === excludeId) return false;
    return isColliding(validItem, otherItem);
  });
};

/**
 * Gets all items that collide with the given item
 * @param {Array} layout - Array of grid items
 * @param {Object} item - Item to check collisions for
 * @param {string} excludeId - Optional ID to exclude
 * @returns {Array} - Array of colliding items
 */
export const getCollisions = (layout, item, excludeId = null) => {
  const { layout: validLayout, item: validItem } = sanitizeParams(layout, item);
  
  return validLayout.filter(otherItem => {
    if (excludeId && otherItem.i === excludeId) return false;
    return isColliding(validItem, otherItem);
  });
};

/**
 * Finds the maximum Y coordinate in the layout
 * @param {Array} layout - Layout array
 * @returns {number} - Maximum Y + height
 */
export const getLayoutHeight = (layout) => {
  const { layout: validLayout } = sanitizeParams(layout);
  
  if (validLayout.length === 0) return 0;
  
  return Math.max(...validLayout.map(item => item.y + item.h));
};

/**
 * Checks if an item fits within grid boundaries
 * @param {Object} item - Grid item
 * @param {number} cols - Column count
 * @returns {boolean}
 */
export const fitsInGrid = (item, cols) => {
  const { item: validItem, cols: validCols } = sanitizeParams([], item, cols);
  return validItem.x >= 0 && 
         validItem.y >= 0 && 
         validItem.x + validItem.w <= validCols;
};

/**
 * Clamps an item to fit within grid boundaries
 * @param {Object} item - Grid item
 * @param {number} cols - Column count
 * @returns {Object} - Clamped item
 */
export const clampToGrid = (item, cols) => {
  const { item: validItem, cols: validCols } = sanitizeParams([], item, cols);
  
  return {
    ...validItem,
    x: Math.max(0, Math.min(validItem.x, validCols - validItem.w)),
    y: Math.max(0, validItem.y),
    w: Math.min(validItem.w, validCols),
    h: Math.max(MIN_ITEM_SIZE.h, validItem.h)
  };
};

/**
 * Compacts the grid by moving items up to fill gaps
 * Uses a stable sorting algorithm to maintain relative positions
 * @param {Array} layout - Layout to compact
 * @param {number} cols - Column count
 * @returns {Array} - Compacted layout
 */
export const compactGrid = (layout, cols = 12) => {
  const { layout: validLayout, cols: validCols } = sanitizeParams(layout, {}, cols);
  
  if (validLayout.length === 0) return [];
  
  // Sort by Y position first, then by X position for stability
  const sorted = [...validLayout].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  const compacted = [];
  
  sorted.forEach(item => {
    let newItem = { ...item };
    
    // Ensure item fits in grid
    newItem = clampToGrid(newItem, validCols);
    
    // Move item up as much as possible
    while (newItem.y > 0) {
      const testItem = { ...newItem, y: newItem.y - 1 };
      if (!hasCollision(compacted, testItem, newItem.i)) {
        newItem.y--;
      } else {
        break;
      }
    }
    
    compacted.push(newItem);
  });
  
  return compacted;
};

/**
 * Finds the next available position for a new item
 * Scans row by row, left to right
 * @param {Array} layout - Current layout
 * @param {Object} itemSize - Size of new item {w, h}
 * @param {number} cols - Column count
 * @param {number} startY - Starting Y position (optional)
 * @returns {Object} - Available position {x, y}
 */
export const findNextAvailablePosition = (layout, itemSize, cols, startY = 0) => {
  const { layout: validLayout, cols: validCols } = sanitizeParams(layout, {}, cols);
  const size = { 
    w: Math.max(MIN_ITEM_SIZE.w, Math.min(itemSize?.w || DEFAULT_ITEM_SIZE.w, validCols)),
    h: Math.max(MIN_ITEM_SIZE.h, itemSize?.h || DEFAULT_ITEM_SIZE.h)
  };
  
  // If item is wider than grid, place at origin
  if (size.w > validCols) {
    return { x: 0, y: Math.max(0, startY) };
  }
  
  const maxY = Math.max(0, startY);
  
  // Search for available position
  for (let y = maxY; y < maxY + MAX_SEARCH_ROWS; y++) {
    for (let x = 0; x <= validCols - size.w; x++) {
      const testPosition = { ...size, x, y };
      
      if (!hasCollision(validLayout, testPosition)) {
        return { x, y };
      }
    }
  }
  
  // Fallback: place at bottom of layout
  const layoutHeight = getLayoutHeight(validLayout);
  return { x: 0, y: layoutHeight };
};

/**
 * Finds the best available position considering layout density
 * Tries to minimize layout height and gaps
 * @param {Array} layout - Current layout
 * @param {Object} itemSize - Size of new item {w, h}
 * @param {number} cols - Column count
 * @returns {Object} - Best available position {x, y}
 */
export const findOptimalPosition = (layout, itemSize, cols) => {
  const { layout: validLayout, cols: validCols } = sanitizeParams(layout, {}, cols);
  const size = { 
    w: Math.max(MIN_ITEM_SIZE.w, Math.min(itemSize?.w || DEFAULT_ITEM_SIZE.w, validCols)),
    h: Math.max(MIN_ITEM_SIZE.h, itemSize?.h || DEFAULT_ITEM_SIZE.h)
  };
  
  if (validLayout.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const candidates = [];
  const maxSearchHeight = getLayoutHeight(validLayout) + 5;
  
  // Collect potential positions
  for (let y = 0; y < maxSearchHeight; y++) {
    for (let x = 0; x <= validCols - size.w; x++) {
      const testPosition = { ...size, x, y };
      
      if (!hasCollision(validLayout, testPosition)) {
        // Calculate score based on position optimality
        const score = calculatePositionScore(testPosition, validLayout, validCols);
        candidates.push({ position: { x, y }, score });
      }
    }
  }
  
  // Return best position or fallback
  if (candidates.length === 0) {
    return { x: 0, y: maxSearchHeight };
  }
  
  // Sort by score (lower is better) and return best position
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0].position;
};

/**
 * Calculates a score for position optimality (lower is better)
 * @param {Object} item - Item with position
 * @param {Array} layout - Current layout
 * @param {number} cols - Column count
 * @returns {number} - Position score
 */
const calculatePositionScore = (item, layout, cols) => {
  let score = 0;
  
  // Prefer higher positions (lower Y)
  score += item.y * 10;
  
  // Prefer left positions slightly
  score += item.x * 0.1;
  
  // Penalty for creating gaps below
  const itemsBelow = layout.filter(other => 
    other.y > item.y + item.h &&
    other.x < item.x + item.w &&
    other.x + other.w > item.x
  );
  score += itemsBelow.length * 5;
  
  return score;
};

/**
 * Moves an item to a new position, handling collisions
 * @param {Array} layout - Current layout
 * @param {string} itemId - ID of item to move
 * @param {Object} newPosition - New position {x, y}
 * @param {number} cols - Column count
 * @param {boolean} allowPush - Whether to push colliding items
 * @returns {Array} - Updated layout
 */
export const moveItem = (layout, itemId, newPosition, cols, { allowPush = true, allowCompact = true } = {}) => {
  const { layout: validLayout, cols: validCols } = sanitizeParams(layout, {}, cols);
  
  const itemIndex = validLayout.findIndex(item => item.i === itemId);
  if (itemIndex === -1) return validLayout;
  
  const item = validLayout[itemIndex];
  const updatedItem = {
    ...item,
    ...clampToGrid({ ...item, ...newPosition }, validCols)
  };
  
  let newLayout = [...validLayout];
  newLayout[itemIndex] = updatedItem;
  
  if (allowPush) {
    // Push colliding items down
    const collisions = getCollisions(newLayout, updatedItem, itemId);
    collisions.forEach(collidingItem => {
      const newY = updatedItem.y + updatedItem.h;
      const collidingIndex = newLayout.findIndex(item => item.i === collidingItem.i);
      if (collidingIndex !== -1) {
        newLayout[collidingIndex] = { ...collidingItem, y: newY };
      }
    });
    if (allowCompact) {
      // Compact after moving
      newLayout = compactGrid(newLayout, validCols);
    }
  }
  
  return newLayout;
};

/**
 * Resizes an item, handling collisions and grid boundaries
 * @param {Array} layout - Current layout
 * @param {string} itemId - ID of item to resize
 * @param {Object} newSize - New size {w, h}
 * @param {number} cols - Column count
 * @returns {Array} - Updated layout
 */
export const resizeItem = (layout, itemId, newSize, cols, { allowCollision = true, allowCompact = true } = {}) => {
  const { layout: validLayout, cols: validCols } = sanitizeParams(layout, {}, cols);
  
  const itemIndex = validLayout.findIndex(item => item.i === itemId);
  if (itemIndex === -1) return validLayout;
  
  const item = validLayout[itemIndex];
  const updatedItem = clampToGrid({
    ...item,
    w: Math.max(MIN_ITEM_SIZE.w, Math.min(newSize.w || item.w, validCols)),
    h: Math.max(MIN_ITEM_SIZE.h, newSize.h || item.h)
  }, validCols);
  
  let newLayout = [...validLayout];
  newLayout[itemIndex] = updatedItem;
  
  if (allowCollision) {
    // Push colliding items down
    const collisions = getCollisions(newLayout, updatedItem, itemId);
    collisions.forEach(collidingItem => {
      const newY = updatedItem.y + updatedItem.h;
      const collidingIndex = newLayout.findIndex(item => item.i === collidingItem.i);
      if (collidingIndex !== -1) {
        newLayout[collidingIndex] = { ...collidingItem, y: newY };
      }
    });
  }
  if (allowCompact) {
    // Compact after resizing
    return compactGrid(newLayout, validCols);
  }
  return newLayout;
};

/**
 * Scales layout for responsive grid changes
 * @param {Array} layout - Current layout
 * @param {number} oldCols - Previous column count
 * @param {number} newCols - New column count
 * @returns {Array} - Scaled layout
 */
export const scaleLayout = (layout, oldCols, newCols) => {
  const { layout: validLayout } = sanitizeParams(layout);
  
  if (oldCols === newCols || oldCols <= 0) return validLayout;
  
  const scale = newCols / oldCols;
  
  const scaledLayout = validLayout.map(item => ({
    ...item,
    x: Math.floor(item.x * scale),
    w: Math.max(MIN_ITEM_SIZE.w, Math.min(Math.round(item.w * scale), newCols))
  }));
  
  // Ensure no items exceed grid and compact
  const clampedLayout = scaledLayout.map(item => clampToGrid(item, newCols));
  return compactGrid(clampedLayout, newCols);
};

/**
 * Validates and fixes a layout, ensuring all items are properly positioned
 * @param {Array} layout - Layout to validate
 * @param {number} cols - Column count
 * @returns {Array} - Fixed layout
 */
export const validateAndFixLayout = (layout, cols) => {
  const { layout: validLayout, cols: validCols } = sanitizeParams(layout, {}, cols);
  
  // Fix items that exceed grid boundaries
  let fixedLayout = validLayout.map(item => clampToGrid(item, validCols));
  
  // Resolve collisions by moving items down
  const resolved = [];
  
  fixedLayout.forEach(item => {
    let newItem = { ...item };
    
    while (hasCollision(resolved, newItem, newItem.i)) {
      newItem = { ...newItem, y: newItem.y + 1 };
    }
    
    resolved.push(newItem);
  });
  
  // Final compact
  return compactGrid(resolved, validCols);
};

// Export utility object for easier importing
export const GridUtils = {
  isValidGridItem,
  isValidLayout,
  isColliding,
  hasCollision,
  getCollisions,
  compactGrid,
  findNextAvailablePosition,
  findOptimalPosition,
  moveItem,
  resizeItem,
  scaleLayout,
  validateAndFixLayout,
  clampToGrid,
  fitsInGrid,
  getLayoutHeight,
  // expose sizing constants for UI to reuse
  DEFAULT_ITEM_SIZE,
  MIN_ITEM_SIZE,
  ROW_HEIGHT,
  GRID_GAP
};