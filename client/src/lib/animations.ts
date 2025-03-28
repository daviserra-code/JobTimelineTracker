// Animation variants for Framer Motion
import { Variants } from "framer-motion";

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Fade in and slide up animation
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { 
      duration: 0.2,
      ease: "easeIn" 
    }
  }
};

// Fade in and slide down animation
export const fadeInDown: Variants = {
  hidden: { 
    opacity: 0, 
    y: -10 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { 
      duration: 0.2,
      ease: "easeIn" 
    }
  }
};

// Scale animation
export const scaleAnimation: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { 
      duration: 0.2,
      ease: "easeIn" 
    }
  }
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Tooltip animation
export const tooltipAnimation: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 5
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    y: 5,
    transition: { 
      duration: 0.15,
      ease: "easeIn" 
    }
  }
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { 
      duration: 0.2,
      ease: "easeIn" 
    }
  }
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { 
      duration: 0.2,
      ease: "easeIn" 
    }
  }
};