import { Dimensions } from 'react-native';

// Get the screen width
const { width } = Dimensions.get('window');

// Set a baseline width from a standard device screen size (e.g., iPhone X)
const guidelineBaseWidth = 375;

/**
 * Scales a given size linearly based on the screen width.
 * @param size The original size (e.g., font size, margin, padding).
 * @returns The new, scaled size for the current device width.
 */
export const scale = (size: number): number => (width / guidelineBaseWidth) * size;

/**
 * A more moderate scaling factor that also rounds to the nearest pixel.
 * Ideal for font sizes to ensure they remain legible and consistent.
 * @param size The original font size.
 * @returns The responsive font size, rounded to the nearest whole number.
 */
export const moderateScale = (size: number): number => {
    const newSize = scale(size);
    return Math.round(newSize);
};