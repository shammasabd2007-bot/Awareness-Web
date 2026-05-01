/**
 * Platform-aware database export
 * Automatically uses the correct backend for web vs native
 */
import { Platform } from 'react-native';

// Re-export everything from the correct implementation
export * from './db.web';
