/**
 * Formats an Ethereum address for display by showing only the first and last few characters
 * @param address The complete Ethereum address
 * @param prefixLength Number of characters to show at the beginning (default: 6)
 * @param suffixLength Number of characters to show at the end (default: 4)
 * @returns Shortened address with ellipsis in the middle
 */
export const formatAddress = (
    address: string, 
    prefixLength = 6, 
    suffixLength = 4
  ): string => {
    // Handle edge cases
    if (!address) return '';
    if (address.length <= prefixLength + suffixLength) return address;
    
    // Ensure the address is a string and has the correct format
    const cleanAddress = address.startsWith('0x') ? address : `0x${address}`;
    
    // Format the address
    return `${cleanAddress.slice(0, prefixLength)}...${cleanAddress.slice(-suffixLength)}`;
  };
  
  /**
   * Returns a custom color based on the address string
   * This can be used to create consistent avatar colors for addresses
   * @param address Ethereum address
   * @returns CSS color class name
   */
  export const getAddressColor = (address: string): string => {
    if (!address) return 'bg-gray-200';
    
    // Use the first 6 characters after '0x' as a color
    const colorValue = address.slice(2, 8);
    
    // Map to one of the primary or secondary color shades
    const colorMap: Record<string, string> = {
      '0': 'bg-primary-100 text-primary-600',
      '1': 'bg-primary-200 text-primary-700',
      '2': 'bg-secondary-100 text-secondary-600',
      '3': 'bg-secondary-200 text-secondary-700',
      '4': 'bg-purple-100 text-purple-600',
      '5': 'bg-indigo-100 text-indigo-600',
      '6': 'bg-blue-100 text-blue-600',
      '7': 'bg-green-100 text-green-600',
      '8': 'bg-amber-100 text-amber-600',
      '9': 'bg-rose-100 text-rose-600',
      'a': 'bg-cyan-100 text-cyan-600',
      'b': 'bg-teal-100 text-teal-600',
      'c': 'bg-violet-100 text-violet-600',
      'd': 'bg-pink-100 text-pink-600',
      'e': 'bg-orange-100 text-orange-600',
      'f': 'bg-emerald-100 text-emerald-600'
    };
    
    return colorMap[colorValue[0].toLowerCase()] || 'bg-gray-100 text-gray-600';
  };
  
  /**
   * Formats a numeric value to a readable string with thousand separators
   * @param value The number to format
   * @param decimals Number of decimal places to include
   * @returns Formatted number string
   */
  export const formatNumber = (value: number, decimals = 0): string => {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };