// --- src/theme/tokens/variants.js ---

/**
 * Shared Framer Motion variants for consistent animations
 * Use these instead of defining variants inline in components
 */

// Fade animations
export const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { 
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1] // easeOut
        }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.15,
            ease: [0.4, 0, 1, 1] // easeIn
        }
    }
};

// Scale + Fade animations
export const scaleFadeVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
            type: 'spring',
            stiffness: 400,
            damping: 30
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: {
            duration: 0.15
        }
    }
};

// Slide animations
export const slideVariants = {
    fromRight: {
        hidden: { x: '100%', opacity: 0 },
        visible: { 
            x: 0, 
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 30,
                stiffness: 300
            }
        },
        exit: { 
            x: '100%', 
            opacity: 0,
            transition: {
                duration: 0.2
            }
        }
    },
    fromLeft: {
        hidden: { x: '-100%', opacity: 0 },
        visible: { 
            x: 0, 
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 30,
                stiffness: 300
            }
        },
        exit: { 
            x: '-100%', 
            opacity: 0,
            transition: {
                duration: 0.2
            }
        }
    },
    fromTop: {
        hidden: { y: -20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 30
            }
        },
        exit: { 
            y: -20, 
            opacity: 0,
            transition: {
                duration: 0.15
            }
        }
    },
    fromBottom: {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 30
            }
        },
        exit: { 
            y: 20, 
            opacity: 0,
            transition: {
                duration: 0.15
            }
        }
    }
};

// Expand/Collapse animations
export const expandVariants = {
    collapsed: { 
        opacity: 0, 
        height: 0,
        transition: {
            height: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            },
            opacity: {
                duration: 0.15
            }
        }
    },
    open: { 
        opacity: 1, 
        height: 'auto',
        transition: {
            height: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            },
            opacity: {
                duration: 0.2,
                delay: 0.05
            }
        }
    }
};

// Backdrop animations
export const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: {
            duration: 0.2
        }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.15
        }
    }
};

// Modal animations
export const modalVariants = {
    hidden: { 
        opacity: 0, 
        scale: 0.9, 
        y: -20 
    },
    visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.9, 
        y: -20,
        transition: {
            duration: 0.2
        }
    }
};

// Stagger children animation
export const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.1
        }
    }
};

export const staggerItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30
        }
    }
};

// List item animations
export const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30
        }
    }
};

// Notification/Toast animations
export const toastVariants = {
    hidden: { 
        opacity: 0, 
        y: -50, 
        scale: 0.9 
    },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25
        }
    },
    exit: { 
        opacity: 0, 
        y: -20,
        scale: 0.95,
        transition: {
            duration: 0.2
        }
    }
};

// Dropdown animations
export const dropdownVariants = {
    hidden: { 
        opacity: 0, 
        scale: 0.95,
        y: -10
    },
    visible: { 
        opacity: 1, 
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        y: -10,
        transition: {
            duration: 0.15
        }
    }
};
