// --- src/types/index.ts ---
/**
 * Core TypeScript type definitions for Homelab Dashboard
 * Provides type safety for gradual migration from JavaScript
 */

export type ServerStatus = 'online' | 'offline' | 'pending';

export interface Server {
  id: string;
  name: string;
  description?: string;
  url: string;
  status: ServerStatus;
  icon?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface Group {
  id: string;
  title: string;
  servers?: Server[];
  layout?: LayoutItem[];
}

export interface Category {
  id: string;
  title: string;
  iconName: string;
  groups?: Group[];
  servers?: Server[];
  layout?: LayoutItem[];
}

export interface WallpaperSettings {
  blur: number;
  brightness: number;
}

export interface HeaderSettings {
  showLogo: boolean;
  customLogo: string | null;
  showTitle: boolean;
  titleText: string;
  showSubtitle: boolean;
  subtitleText: string;
  searchEngine: string;
}

export interface NotificationSettings {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number; // milliseconds
  soundEnabled?: boolean;
  soundVolume?: number; // 0-100
  soundType?: 'default' | 'chime' | 'ping' | 'bell';
  showProgress?: boolean;
  minLevel?: 'all' | 'info' | 'warning' | 'error';
  categoryFilters?: {
    status?: boolean;
    performance?: boolean;
    network?: boolean;
    system?: boolean;
  };
}

export interface SidebarSettings {
  // Position
  position?: 'left' | 'right' | 'top' | 'bottom' | 'auto';
  
  // Mode
  mode?: 'fixed' | 'overlay' | 'mini' | 'compact';
  
  // Behavior
  behavior?: 'always-visible' | 'auto-hide' | 'hover-expand';
  autoHideDelay?: number; // milliseconds, default 3000
  
  // Appearance
  iconSize?: 'small' | 'medium' | 'large';
  density?: 'compact' | 'comfortable' | 'spacious';
  showLabels?: boolean;
  showBadges?: boolean;
  showGroupCounts?: boolean;
  
  // Size
  collapsedWidth?: number; // default 60
  expandedWidth?: number; // default 280
  horizontalHeight?: number; // for top/bottom, default 80
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  animations: boolean;
  background: string;
  font: string;
  linkBehavior: 'newTab' | 'sameTab';
  customWallpaper: string | null;
  wallpaperSettings: WallpaperSettings;
  header: HeaderSettings;
  pingInterval: number;
  pingTimeout: number;
  gridDensity: 'compact' | 'medium' | 'spacious';
  gridColumns?: number; // Yeni: Özel kolon sayısı (2-6)
  cardSize?: 'small' | 'medium' | 'large'; // Yeni: Kart boyutu
  showCardDescriptions: boolean;
  showCardUrls: boolean;
  showCardStatus?: boolean; // Yeni: Status badge göster/gizle
  showCardTags?: boolean; // Yeni: Tag'leri göster/gizle
  showCardMetrics?: boolean; // Yeni: Response time göster/gizle
  sidebarAutoCollapse: boolean;
  seedColor?: string;
  headerOpacity?: number;
  sidebarOpacity?: number;
  customAccentColor?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'diagonal' | 'waves' | 'hexagon' | 'zigzag' | 'crosses';
  cardOpacity?: number;
  cardBlur?: number;
  notifications?: NotificationSettings; // Yeni: Bildirim tercihleri
  sidebar?: SidebarSettings; // Yeni: Sidebar özelleştirme
}

export interface AppData {
  settings: AppSettings;
  categories: Category[];
}

// UI State Types
export interface ActiveView {
  type: 'category' | 'group' | 'favorites' | 'settings';
  id: string | null;
}

export interface UIPreferences {
  activeView: ActiveView;
  isGridView: boolean;
  isSidebarCollapsed: boolean;
  activeCategoryDropdown: string | null;
  sidebarWidth: number;
}

export interface ModalState {
  server: boolean;
  category: boolean;
  group: boolean;
  confirm: boolean;
  tags: boolean;
}

export interface EditingData {
  server: Server | null;
  category: Category | null;
  group: Group | null;
  confirm: any | null;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface StatusUpdate {
  [serverId: string]: ServerStatus;
}

// Event Handler Types
export type ModalType = keyof ModalState;
export type ViewType = ActiveView['type'];

// Theme Types
export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  onError: string;
}

// Component Props Types
export interface ServerCardProps {
  server: Server;
  isInteracting?: boolean;
}

export interface GridCellProps {
  item: LayoutItem;
  children: React.ReactNode;
  gridBounds?: {
    width: number;
    height: number;
    cols: number;
  };
}

// Context Types
export interface ServerDataContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  handleAddOrUpdate: (type: string, data: any) => void;
  handleDelete: (type: string, ids: any) => void;
  toggleFavorite: (serverId: string) => void;
  updateItemLayout: (itemId: string, containerId: string, newLayoutProps: any, cols: number) => void;
  handleLayoutScale: (oldCols: number, newCols: number) => void;
}

export interface UIContextType {
  uiPrefs: UIPreferences;
  setUiPref: (key: keyof UIPreferences, value: any) => void;
  isMobile: boolean;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  effectiveIsDarkMode: boolean;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
  editMode: boolean;
  toggleEditMode: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isSearchActive: boolean;
  setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
  hoveredCategory: string | null;
  setHoveredCategory: React.Dispatch<React.SetStateAction<string | null>>;
  isModalOpen: ModalState;
  editingData: EditingData;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: (type?: ModalType) => void;
  mainContentRef: React.RefObject<HTMLElement>;
  handleSidebarMouseEnter: () => void;
  handleSidebarMouseLeave: () => void;
}

export interface SettingsContextType {
  appSettings: AppSettings;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  isInitialLoad: boolean;
  isSaving: boolean;
  connectionStatus: string;
  pingServer: (serverId: string) => void;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

// Constants
export const DND_TYPES = {
  CATEGORY: 'category',
  GROUP: 'group',
  SERVER: 'server'
} as const;

export const MODAL_TYPES = {
  SERVER: 'server',
  CATEGORY: 'category',
  GROUP: 'group',
  CONFIRM: 'confirm',
  TAGS: 'tags'
} as const;

export const VIEW_TYPES = {
  CATEGORY: 'category',
  GROUP: 'group',
  FAVORITES: 'favorites',
  SETTINGS: 'settings'
} as const;

export type DndType = typeof DND_TYPES[keyof typeof DND_TYPES];
export type ModalTypeLiteral = typeof MODAL_TYPES[keyof typeof MODAL_TYPES];
export type ViewTypeLiteral = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];
