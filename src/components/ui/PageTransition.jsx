// PageTransition wrapper component per animazioni fluide tra pagine
import { motion } from 'framer-motion';
import { pageVariants } from '../config/motionConfig';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
      style={{
        willChange: 'transform, opacity',
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
