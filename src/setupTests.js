import '@testing-library/jest-dom';

// Mock di Firebase
jest.mock('./firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  }
}));

// Mock di react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({})
}));

// Mock di framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    aside: 'aside'
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({ start: jest.fn() })
}));

// Mock di lucide-react
jest.mock('lucide-react', () => ({
  Home: () => 'HomeIcon',
  Users: () => 'UsersIcon',
  MessageSquare: () => 'MessageSquareIcon',
  Settings: () => 'SettingsIcon',
  Sun: () => 'SunIcon',
  Moon: () => 'MoonIcon'
}));

// Global test utilities
global.fetch = jest.fn();

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});